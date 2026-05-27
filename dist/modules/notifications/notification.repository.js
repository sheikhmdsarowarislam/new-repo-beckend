"use strict";
// src/modules/notifications/notification.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateUserNotificationStats = exports.bulkMarkNotificationsAsRead = exports.bulkDeleteOldNotifications = exports.bulkDeleteNotificationsByUser = exports.deleteNotificationByUserAndId = exports.deleteNotificationById = exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.updateNotificationById = exports.createBulkNotifications = exports.createNotification = exports.countUnreadNotificationsByUser = exports.countNotificationsByUser = exports.findUnreadNotificationsByUser = exports.findNotificationsByUser = exports.findNotificationById = void 0;
const mongoose_1 = require("mongoose");
const notification_model_1 = __importDefault(require("./notification.model"));
// --- READ Operations ---
const findNotificationById = (notificationId, session) => {
    return notification_model_1.default.findById(notificationId)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findNotificationById = findNotificationById;
const findNotificationsByUser = (userId, options = {}, session) => {
    const { page = 1, limit = 20, isRead, type } = options;
    const skip = (page - 1) * limit;
    const query = { user: userId };
    if (isRead !== undefined)
        query.isRead = isRead;
    if (type)
        query.type = type;
    return notification_model_1.default.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findNotificationsByUser = findNotificationsByUser;
const findUnreadNotificationsByUser = (userId, session) => {
    return notification_model_1.default.find({ user: userId, isRead: false })
        .sort({ createdAt: -1 })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findUnreadNotificationsByUser = findUnreadNotificationsByUser;
const countNotificationsByUser = (userId, isRead, session) => {
    const query = { user: userId };
    if (isRead !== undefined)
        query.isRead = isRead;
    return notification_model_1.default.countDocuments(query).session(session || null);
};
exports.countNotificationsByUser = countNotificationsByUser;
const countUnreadNotificationsByUser = (userId, session) => {
    return notification_model_1.default.countDocuments({ user: userId, isRead: false }).session(session || null);
};
exports.countUnreadNotificationsByUser = countUnreadNotificationsByUser;
// --- WRITE Operations ---
const createNotification = (data, session) => {
    return notification_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create notification document.");
        }
        return res[0];
    });
};
exports.createNotification = createNotification;
const createBulkNotifications = (notifications, session) => {
    return notification_model_1.default.create(notifications, { session: session || undefined, ordered: true });
};
exports.createBulkNotifications = createBulkNotifications;
const updateNotificationById = (notificationId, updateData, session) => {
    return notification_model_1.default.findByIdAndUpdate(notificationId, updateData, {
        new: true,
        runValidators: true
    }).session(session || null);
};
exports.updateNotificationById = updateNotificationById;
const markNotificationAsRead = (notificationId, userId, session) => {
    return notification_model_1.default.findOneAndUpdate({ _id: notificationId, user: userId }, { isRead: true }, { new: true }).session(session || null);
};
exports.markNotificationAsRead = markNotificationAsRead;
const markAllNotificationsAsRead = (userId, session) => {
    return notification_model_1.default.updateMany({ user: userId, isRead: false }, { isRead: true }).session(session || null);
};
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
const deleteNotificationById = (notificationId, session) => {
    return notification_model_1.default.findByIdAndDelete(notificationId).session(session || null);
};
exports.deleteNotificationById = deleteNotificationById;
const deleteNotificationByUserAndId = (notificationId, userId, session) => {
    return notification_model_1.default.findOneAndDelete({
        _id: notificationId,
        user: userId
    }).session(session || null);
};
exports.deleteNotificationByUserAndId = deleteNotificationByUserAndId;
// --- BULK Operations ---
const bulkDeleteNotificationsByUser = async (userId, session) => {
    await notification_model_1.default.deleteMany({ user: userId }).session(session || null);
};
exports.bulkDeleteNotificationsByUser = bulkDeleteNotificationsByUser;
const bulkDeleteOldNotifications = async (daysOld = 90, session) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    await notification_model_1.default.deleteMany({
        createdAt: { $lt: cutoffDate },
        isRead: true
    }).session(session || null);
};
exports.bulkDeleteOldNotifications = bulkDeleteOldNotifications;
const bulkMarkNotificationsAsRead = async (notificationIds, userId, session) => {
    return notification_model_1.default.updateMany({
        _id: { $in: notificationIds },
        user: userId,
        isRead: false
    }, { isRead: true }).session(session || null);
};
exports.bulkMarkNotificationsAsRead = bulkMarkNotificationsAsRead;
// --- AGGREGATION Operations ---
const aggregateUserNotificationStats = async (userId) => {
    // OPTIMIZATION: Enhanced aggregation pipeline with better performance
    return notification_model_1.default.aggregate([
        { $match: { user: new mongoose_1.Types.ObjectId(userId) } },
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
exports.aggregateUserNotificationStats = aggregateUserNotificationStats;
//# sourceMappingURL=notification.repository.js.map