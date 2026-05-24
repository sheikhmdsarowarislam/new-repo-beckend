// src/modules/notifications/notification.service.ts

import mongoose, { Types } from 'mongoose';
import { withTransaction } from "../../utils/withTransaction";
import { invalidateCache, setCache, getCache } from "../../utils/cache";
import Notification, { INotification } from "./notification.model";
import Course from "../courses/course.model";
import Enrollment from "../enrollments/enrollment.model";
import User from "../users/user.model";
import { ServiceResponse } from "../../@types/api";

const NOTIFICATION_CACHE_BASE = 'notifications';

// Enhanced notification query options
interface EnhancedNotificationOptions {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
  priority?: 'high' | 'normal' | 'low';
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  sortBy?: 'createdAt' | 'type' | 'isRead' | 'priority';
  sortOrder?: 'asc' | 'desc';
  relatedEntityId?: string;
  includeArchived?: boolean;
}

// Notification analytics interface
interface NotificationAnalytics {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentActivity: Array<{
    type: string;
    count: number;
    lastActivity: Date;
  }>;
  engagementRate: number;
  averageResponseTime: number;
}

// --- CORE SERVICE FUNCTIONS ---

/**
 * Create a single notification
 */
export const createNotificationService = async (
  userId: string, 
  type: string, 
  message: string, 
  relatedEntityId?: string
): Promise<ServiceResponse<INotification>> => {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            message,
            relatedEntityId,
            isRead: false
        });
        
        // Invalidate caches (batch, non-blocking)
        const cacheKeys = [
            `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
            `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
        ];
        
        Promise.all(cacheKeys.map(key => invalidateCache(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        
        return {
            success: true,
            data: notification,
            message: 'Notification created successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Notification creation failed',
            errors: [error.message]
        };
    }
};

/**
 * Create notification (alias for backwards compatibility)
 */
export const createNotification = createNotificationService;

/**
 * Send bulk notifications
 */
export const sendBulkNotificationService = async (
  userIds: string[], 
  type: string, 
  message: string, 
  relatedEntityId?: string
): Promise<ServiceResponse<INotification[]>> => {
    try {
        const notifications = await withTransaction(async (session) => {
            const notifications = userIds.map(userId => ({
                user: userId,
                type,
                message,
                relatedEntityId,
                isRead: false
            }));

            const createdNotifications = await Notification.create(notifications, { session, ordered: true });

            // OPTIMIZATION: Batch cache invalidation for all affected users
            const cacheKeys = userIds.flatMap(userId => [
                `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
                `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
            ]);
            
            Promise.all(cacheKeys.map(key => invalidateCache(key)))
                .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

            return createdNotifications;
        });

        return {
            success: true,
            data: notifications,
            message: 'Bulk notifications sent successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Bulk notification failed',
            errors: [error.message]
        };
    }
};

/**
 * Get user notifications with caching
 */
export const getUserNotificationsService = async (
  userId: string, 
  options: any = {}, 
  cacheKey: string
): Promise<ServiceResponse<any>> => {
    try {
        if (cacheKey) {
            const cached = await getCache(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: cached,
                    message: 'User notifications retrieved from cache'
                };
            }
        }

        const { page = 1, limit = 20, isRead, type } = options;
        const skip = (page - 1) * limit;
        
        const query: any = { user: userId };
        if (isRead !== undefined) query.isRead = isRead;
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Notification.countDocuments(query);
        
        const responseData = {
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            cached: false
        };
        
        if (cacheKey) {
            await setCache(cacheKey, responseData, 300);
        }
        
        return {
            success: true,
            data: responseData,
            message: 'User notifications retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve user notifications',
            errors: [error.message]
        };
    }
};

/**
 * Mark notification as read
 */
export const markNotificationAsReadService = async (
  notificationId: string, 
  userId: string
): Promise<ServiceResponse<INotification>> => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return {
                success: false,
                message: 'Notification not found or unauthorized',
                errors: ['No notification found with the provided ID or insufficient permissions']
            };
        }

        // Invalidate caches (batch, non-blocking)
        const cacheKeys = [
            `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
            `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
        ];
        
        Promise.all(cacheKeys.map(key => invalidateCache(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

        return {
            success: true,
            data: notification,
            message: 'Notification marked as read successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to mark notification as read',
            errors: [error.message]
        };
    }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsReadService = async (userId: string): Promise<ServiceResponse<any>> => {
    try {
        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );

        // Invalidate caches (batch, non-blocking)
        const cacheKeys = [
            `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
            `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
        ];
        
        Promise.all(cacheKeys.map(key => invalidateCache(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

        return {
            success: true,
            data: result,
            message: 'All notifications marked as read successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to mark all notifications as read',
            errors: [error.message]
        };
    }
};

/**
 * Delete notification
 */
export const deleteNotificationService = async (
  notificationId: string, 
  userId: string
): Promise<ServiceResponse<any>> => {
    try {
        const notification = await Notification.findOneAndDelete({ 
            _id: notificationId, 
            user: userId 
        });

        if (!notification) {
            return {
                success: false,
                message: 'Notification not found or unauthorized',
                errors: ['No notification found with the provided ID or insufficient permissions']
            };
        }

        // Invalidate caches (batch, non-blocking)
        const cacheKeys = [
            `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
            `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
        ];
        
        Promise.all(cacheKeys.map(key => invalidateCache(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

        return {
            success: true,
            data: undefined,
            message: 'Notification deleted successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Notification deletion failed',
            errors: [error.message]
        };
    }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCountService = async (userId: string): Promise<ServiceResponse<number>> => {
    try {
        const count = await Notification.countDocuments({ user: userId, isRead: false });
        
        return {
            success: true,
            data: count,
            message: 'Unread count retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to get unread count',
            errors: [error.message]
        };
    }
};

/**
 * Get notification statistics with caching
 */
export const getNotificationStatsService = async (
  options: any = {}, 
  cacheKey: string
): Promise<ServiceResponse<any>> => {
    try {
        if (cacheKey) {
            const cached = await getCache(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: cached,
                    message: 'Notification stats retrieved from cache'
                };
            }
        }

        const { startDate, endDate, type } = options;
        
        const matchStage: any = {};
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate) matchStage.createdAt.$gte = startDate;
            if (endDate) matchStage.createdAt.$lte = endDate;
        }
        if (type) matchStage.type = type;

        const stats = await Notification.aggregate([
            ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
            {
                $group: {
                    _id: "$type",
                    total: { $sum: 1 },
                    read: { $sum: { $cond: ["$isRead", 1, 0] } },
                    unread: { $sum: { $cond: ["$isRead", 0, 1] } }
                }
            },
            {
                $addFields: {
                    readRate: { 
                        $round: [{ $multiply: [{ $divide: ["$read", "$total"] }, 100] }, 2] 
                    }
                }
            },
            { $sort: { total: -1 } }
        ]);

        const responseData = { stats, cached: false };
        
        if (cacheKey) {
            await setCache(cacheKey, responseData, 600);
        }
        
        return {
            success: true,
            data: responseData,
            message: 'Notification stats retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve notification stats',
            errors: [error.message]
        };
    }
};

// --- ENHANCED SERVICE FUNCTIONS (consolidated from notification.enhanced.ts) ---

/**
 * Get notifications with advanced filtering and sorting
 */
export const getEnhancedNotifications = async (
  userId: string,
  options: any = {}
): Promise<ServiceResponse<any>> => {
  try {
    // Transform query params from strings to proper types
    const page = options.page ? parseInt(options.page) : 1;
    const limit = options.limit ? parseInt(options.limit) : 20;
    const isRead = options.isRead === 'true' ? true : options.isRead === 'false' ? false : undefined;
    const type = options.type;
    const priority = options.priority;
    const dateFrom = options.dateFrom ? new Date(options.dateFrom) : undefined;
    const dateTo = options.dateTo ? new Date(options.dateTo) : undefined;
    const search = options.search;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    const relatedEntityId = options.relatedEntityId;
    const includeArchived = options.includeArchived === 'true';

    const skip = (page - 1) * limit;

    const query: any = { user: userId };
    if (isRead !== undefined) query.isRead = isRead;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (relatedEntityId) query.relatedEntityId = relatedEntityId;
    if (!includeArchived) query.archived = { $ne: true };

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = dateFrom;
      if (dateTo) query.createdAt.$lte = dateTo;
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const notifications = await Notification.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('relatedEntityId')
      .lean();

    const total = await Notification.countDocuments(query);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const responseData = {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      filters: {
        isRead,
        type,
        priority,
        dateFrom,
        dateTo,
        search,
        sortBy,
        sortOrder
      }
    };

    return {
      success: true,
      data: responseData,
      message: 'Notifications retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve notifications',
      errors: [error.message]
    };
  }
};

/**
 * Get notification analytics
 */
export const getNotificationAnalytics = async (
  userId: string,
  options: { dateFrom?: Date; dateTo?: Date } = {}
): Promise<ServiceResponse<NotificationAnalytics>> => {
  try {
    const { dateFrom, dateTo } = options;

    const dateFilter: any = { user: userId };
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = dateFrom;
      if (dateTo) dateFilter.createdAt.$lte = dateTo;
    }

    const [total, unread] = await Promise.all([
      Notification.countDocuments(dateFilter),
      Notification.countDocuments({ ...dateFilter, isRead: false })
    ]);

    const typeAggregation = await Notification.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const byType = typeAggregation.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const priorityAggregation = await Notification.aggregate([
      { $match: { ...dateFilter, priority: { $exists: true } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const byPriority = priorityAggregation.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const recentActivityRaw = await Notification.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { lastActivity: -1 } },
      { $limit: 5 }
    ]);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentNotifications = await Notification.countDocuments({
      ...dateFilter,
      createdAt: { $gte: oneDayAgo }
    });

    const readRecentNotifications = await Notification.countDocuments({
      ...dateFilter,
      createdAt: { $gte: oneDayAgo },
      isRead: true
    });

    const engagementRate = recentNotifications > 0 
      ? (readRecentNotifications / recentNotifications) * 100 
      : 0;

    const responseTimeAggregation = await Notification.aggregate([
      { $match: { ...dateFilter, isRead: true, readAt: { $exists: true } } },
      {
        $project: {
          responseTime: {
            $subtract: ['$readAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          averageResponseTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const averageResponseTime = responseTimeAggregation.length > 0 
      ? responseTimeAggregation[0].averageResponseTime 
      : 0;

    const analytics: NotificationAnalytics = {
      total,
      unread,
      byType,
      byPriority,
      recentActivity: recentActivityRaw.map((item: any) => ({
        type: item._id,
        count: item.count,
        lastActivity: item.lastActivity
      })),
      engagementRate: Math.round(engagementRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime / 1000)
    };

    return {
      success: true,
      data: analytics,
      message: 'Notification analytics retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve notification analytics',
      errors: [error.message]
    };
  }
};

/**
 * Mark notifications as read (bulk or all)
 */
export const markNotificationsAsReadEnhanced = async (
  userId: string,
  notificationIds?: string[],
  markAll: boolean = false
): Promise<ServiceResponse<any>> => {
  try {
    const query: any = { user: userId, isRead: false };
    if (!markAll && notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds.map(id => new Types.ObjectId(id)) };
    }

    const result = await Notification.updateMany(
      query,
      { $set: { isRead: true, readAt: new Date() } }
    );

    // OPTIMIZATION: Batch cache invalidation
    const cacheKeys = [
        `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
        `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
    ];
    
    Promise.all(cacheKeys.map(key => invalidateCache(key)))
        .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

    return {
      success: true,
      data: { modifiedCount: (result as any).modifiedCount },
      message: `${(result as any).modifiedCount} notifications marked as read`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to mark notifications as read',
      errors: [error.message]
    };
  }
};

/**
 * Archive notifications
 */
export const archiveNotifications = async (
  userId: string,
  notificationIds: string[]
): Promise<ServiceResponse<any>> => {
  try {
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds.map(id => new Types.ObjectId(id)) }, user: userId },
      { $set: { archived: true, archivedAt: new Date() } }
    );

    // OPTIMIZATION: Non-blocking cache invalidation
    invalidateCache(`${NOTIFICATION_CACHE_BASE}:user=${userId}`)
        .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

    return {
      success: true,
      data: { modifiedCount: (result as any).modifiedCount },
      message: `${(result as any).modifiedCount} notifications archived`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to archive notifications',
      errors: [error.message]
    };
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (
  userId: string
): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use lean query for better performance
    const user = await User.findById(userId).select('+notificationPreferences').lean();

    const defaultPreferences = {
      email: {
        courseUpdates: true,
        newReviews: true,
        courseCompletion: true,
        certificates: true,
        discussions: false,
        payments: true
      },
      push: {
        enabled: true,
        courseUpdates: true,
        newReviews: true,
        discussions: true,
        payments: true
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    const preferences = (user as any)?.notificationPreferences || defaultPreferences;

    return {
      success: true,
      data: preferences,
      message: 'Notification preferences retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve notification preferences',
      errors: [error.message]
    };
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: any
): Promise<ServiceResponse<any>> => {
  try {
    await User.findByIdAndUpdate(userId, { $set: { notificationPreferences: preferences } });
    return {
      success: true,
      data: preferences,
      message: 'Notification preferences updated successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to update notification preferences',
      errors: [error.message]
    };
  }
};

// --- SPECIALIZED NOTIFICATION FUNCTIONS ---

/**
 * Send course update notification to all enrolled students
 */
export const sendCourseUpdateNotification = async (courseId: string, updateType: string): Promise<INotification[]> => {
  // OPTIMIZATION: Use parallel queries with lean
  const [course, enrollments] = await Promise.all([
    Course.findById(courseId).lean(),
    Enrollment.find({ course: courseId }).lean()
  ]);
  
  if (!course || enrollments.length === 0) return [];

  const userIds = enrollments.map(enrollment => enrollment.student.toString());
  
  const result = await sendBulkNotificationService(
    userIds,
    'course_update',
    `Course "${course.title}" has been updated`,
    courseId
  );
  
  return result.success ? result.data! : [];
};

/**
 * Send enrollment notification
 */
export const sendEnrollmentNotification = async (userId: string, courseId: string): Promise<INotification> => {
  // OPTIMIZATION: Use lean query for better performance
  const course = await Course.findById(courseId).lean();
  const result = await createNotificationService(
    userId,
    'enrollment',
    `Successfully enrolled in ${course?.title}`,
    courseId
  );
  
  return result.success ? result.data! : null as any;
};

/**
 * Send course completion notification
 */
export const sendCourseCompletionNotification = async (userId: string, courseId: string): Promise<INotification> => {
  // OPTIMIZATION: Use lean query for better performance
  const course = await Course.findById(courseId).lean();
  const result = await createNotificationService(
    userId,
    'course_completion',
    `Congratulations! You've completed ${course?.title}`,
    courseId
  );
  
  return result.success ? result.data! : null as any;
};

/**
 * Send new review notification to instructor
 */
export const sendNewReviewNotification = async (instructorId: string, courseId: string, rating: number): Promise<INotification> => {
  // OPTIMIZATION: Use lean query for better performance
  const course = await Course.findById(courseId).lean();
  const result = await createNotificationService(
    instructorId,
    'new_review',
    `New ${rating}-star review for ${course?.title}`,
    courseId
  );
  
  return result.success ? result.data! : null as any;
};

/**
 * Send certificate earned notification
 */
export const sendCertificateEarnedNotification = async (userId: string, courseId: string): Promise<INotification> => {
  // OPTIMIZATION: Use lean query for better performance
  const course = await Course.findById(courseId).lean();
  const result = await createNotificationService(
    userId,
    'certificate_earned',
    `Certificate earned for completing ${course?.title}`,
    courseId
  );
  
  return result.success ? result.data! : null as any;
};

/**
 * Send payment success notification
 */
export const sendPaymentSuccessNotification = async (userId: string, courseId: string, amount: number): Promise<INotification> => {
  // OPTIMIZATION: Use lean query for better performance
  const course = await Course.findById(courseId).lean();
  const result = await createNotificationService(
    userId,
    'payment_success',
    `Payment of $${amount} successful for ${course?.title}`,
    courseId
  );
  
  return result.success ? result.data! : null as any;
};

/**
 * Send payment failed notification
 */
export const sendPaymentFailedNotification = async (userId: string, courseId: string): Promise<INotification> => {
  // OPTIMIZATION: Use lean query for better performance
  const course = await Course.findById(courseId).lean();
  const result = await createNotificationService(
    userId,
    'payment_failed',
    `Payment failed for ${course?.title}. Please try again.`,
    courseId
  );
  
  return result.success ? result.data! : null as any;
};