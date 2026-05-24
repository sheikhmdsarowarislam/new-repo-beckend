// src/modules/notifications/notification.repository.ts

import { Types, ClientSession } from 'mongoose';
import Notification, { INotification } from './notification.model';


// --- READ Operations ---

export const findNotificationById = (
  notificationId: string, 
  session?: ClientSession
): Promise<any> => {
  return Notification.findById(notificationId)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findNotificationsByUser = (
  userId: string, 
  options: any = {},
  session?: ClientSession
): Promise<any[]> => {
  const { page = 1, limit = 20, isRead, type } = options;
  const skip = (page - 1) * limit;
  
  const query: any = { user: userId };
  if (isRead !== undefined) query.isRead = isRead;
  if (type) query.type = type;

  return Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findUnreadNotificationsByUser = (
  userId: string, 
  session?: ClientSession
): Promise<any[]> => {
  return Notification.find({ user: userId, isRead: false })
    .sort({ createdAt: -1 })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};



export const countNotificationsByUser = (
  userId: string, 
  isRead?: boolean,
  session?: ClientSession
): Promise<number> => {
  const query: any = { user: userId };
  if (isRead !== undefined) query.isRead = isRead;
  
  return Notification.countDocuments(query).session(session || null);
};

export const countUnreadNotificationsByUser = (
  userId: string, 
  session?: ClientSession
): Promise<number> => {
  return Notification.countDocuments({ user: userId, isRead: false }).session(session || null);
};

// --- WRITE Operations ---

export const createNotification = (
  data: Partial<INotification>, 
  session?: ClientSession
): Promise<INotification> => {
  return Notification.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create notification document.");
    }
    return res[0]!;
  });
};

export const createBulkNotifications = (
  notifications: Partial<INotification>[], 
  session?: ClientSession
): Promise<INotification[]> => {
  return Notification.create(notifications, { session: session || undefined, ordered: true });
};

export const updateNotificationById = (
  notificationId: string, 
  updateData: Partial<INotification>, 
  session?: ClientSession
): Promise<INotification | null> => {
  return Notification.findByIdAndUpdate(notificationId, updateData, { 
    new: true, 
    runValidators: true 
  }).session(session || null);
};

export const markNotificationAsRead = (
  notificationId: string, 
  userId: string,
  session?: ClientSession
): Promise<INotification | null> => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  ).session(session || null);
};

export const markAllNotificationsAsRead = (
  userId: string,
  session?: ClientSession
): Promise<any> => {
  return Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  ).session(session || null);
};

export const deleteNotificationById = (
  notificationId: string, 
  session?: ClientSession
): Promise<INotification | null> => {
  return Notification.findByIdAndDelete(notificationId).session(session || null);
};

export const deleteNotificationByUserAndId = (
  notificationId: string,
  userId: string,
  session?: ClientSession
): Promise<INotification | null> => {
  return Notification.findOneAndDelete({ 
    _id: notificationId, 
    user: userId 
  }).session(session || null);
};

// --- BULK Operations ---

export const bulkDeleteNotificationsByUser = async (
  userId: string, 
  session?: ClientSession
): Promise<void> => {
  await Notification.deleteMany({ user: userId }).session(session || null);
};

export const bulkDeleteOldNotifications = async (
  daysOld: number = 90, 
  session?: ClientSession
): Promise<void> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  await Notification.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  }).session(session || null);
};

export const bulkMarkNotificationsAsRead = async (
  notificationIds: string[], 
  userId: string,
  session?: ClientSession
): Promise<any> => {
  return Notification.updateMany(
    { 
      _id: { $in: notificationIds }, 
      user: userId,
      isRead: false 
    },
    { isRead: true }
  ).session(session || null);
};

// --- AGGREGATION Operations ---


export const aggregateUserNotificationStats = async (userId: string): Promise<any> => {
  // OPTIMIZATION: Enhanced aggregation pipeline with better performance
  return Notification.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        read: { $sum: { $cond: ["$isRead", 1, 0] } },
        unread: { $sum: { $cond: ["$isRead", 0, 1] } },
        typeBreakdown: {
          $push: {
            type: "$type",
            isRead: "$isRead"
          }
        }
      }
    },
    {
      $addFields: {
        readRate: {
          $round: [
            { $multiply: [{ $divide: ["$read", { $ifNull: ["$total", 1] }] }, 100] },
            2
          ]
        }
      }
    }
  ]);
};
