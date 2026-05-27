"use strict";
// src/modules/notifications/notification.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaymentFailedNotification = exports.sendPaymentSuccessNotification = exports.sendCertificateEarnedNotification = exports.sendNewReviewNotification = exports.sendCourseCompletionNotification = exports.sendEnrollmentNotification = exports.sendCourseUpdateNotification = exports.updateNotificationPreferences = exports.getNotificationPreferences = exports.archiveNotifications = exports.markNotificationsAsReadEnhanced = exports.getNotificationAnalytics = exports.getEnhancedNotifications = exports.getNotificationStatsService = exports.getUnreadNotificationCountService = exports.deleteNotificationService = exports.markAllNotificationsAsReadService = exports.markNotificationAsReadService = exports.getUserNotificationsService = exports.sendBulkNotificationService = exports.createNotification = exports.createNotificationService = void 0;
const mongoose_1 = require("mongoose");
const withTransaction_1 = require("../../utils/withTransaction");
const cache_1 = require("../../utils/cache");
const notification_model_1 = __importDefault(require("./notification.model"));
const course_model_1 = __importDefault(require("../courses/course.model"));
const enrollment_model_1 = __importDefault(require("../enrollments/enrollment.model"));
const user_model_1 = __importDefault(require("../users/user.model"));
const NOTIFICATION_CACHE_BASE = 'notifications';
// --- CORE SERVICE FUNCTIONS ---
/**
 * Create a single notification
 */
const createNotificationService = async (userId, type, message, relatedEntityId) => {
    try {
        const notification = await notification_model_1.default.create({
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
        Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        return {
            success: true,
            data: notification,
            message: 'Notification created successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Notification creation failed',
            errors: [error.message]
        };
    }
};
exports.createNotificationService = createNotificationService;
/**
 * Create notification (alias for backwards compatibility)
 */
exports.createNotification = exports.createNotificationService;
/**
 * Send bulk notifications
 */
const sendBulkNotificationService = async (userIds, type, message, relatedEntityId) => {
    try {
        const notifications = await (0, withTransaction_1.withTransaction)(async (session) => {
            const notifications = userIds.map(userId => ({
                user: userId,
                type,
                message,
                relatedEntityId,
                isRead: false
            }));
            const createdNotifications = await notification_model_1.default.create(notifications, { session, ordered: true });
            // OPTIMIZATION: Batch cache invalidation for all affected users
            const cacheKeys = userIds.flatMap(userId => [
                `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
                `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
            ]);
            Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
                .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
            return createdNotifications;
        });
        return {
            success: true,
            data: notifications,
            message: 'Bulk notifications sent successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Bulk notification failed',
            errors: [error.message]
        };
    }
};
exports.sendBulkNotificationService = sendBulkNotificationService;
/**
 * Get user notifications with caching
 */
const getUserNotificationsService = async (userId, options = {}, cacheKey) => {
    try {
        if (cacheKey) {
            const cached = await (0, cache_1.getCache)(cacheKey);
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
        const query = { user: userId };
        if (isRead !== undefined)
            query.isRead = isRead;
        if (type)
            query.type = type;
        const notifications = await notification_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await notification_model_1.default.countDocuments(query);
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
            await (0, cache_1.setCache)(cacheKey, responseData, 300);
        }
        return {
            success: true,
            data: responseData,
            message: 'User notifications retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve user notifications',
            errors: [error.message]
        };
    }
};
exports.getUserNotificationsService = getUserNotificationsService;
/**
 * Mark notification as read
 */
const markNotificationAsReadService = async (notificationId, userId) => {
    try {
        const notification = await notification_model_1.default.findOneAndUpdate({ _id: notificationId, user: userId }, { isRead: true }, { new: true });
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
        Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        return {
            success: true,
            data: notification,
            message: 'Notification marked as read successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to mark notification as read',
            errors: [error.message]
        };
    }
};
exports.markNotificationAsReadService = markNotificationAsReadService;
/**
 * Mark all notifications as read
 */
const markAllNotificationsAsReadService = async (userId) => {
    try {
        const result = await notification_model_1.default.updateMany({ user: userId, isRead: false }, { isRead: true });
        // Invalidate caches (batch, non-blocking)
        const cacheKeys = [
            `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
            `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
        ];
        Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        return {
            success: true,
            data: result,
            message: 'All notifications marked as read successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to mark all notifications as read',
            errors: [error.message]
        };
    }
};
exports.markAllNotificationsAsReadService = markAllNotificationsAsReadService;
/**
 * Delete notification
 */
const deleteNotificationService = async (notificationId, userId) => {
    try {
        const notification = await notification_model_1.default.findOneAndDelete({
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
        Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        return {
            success: true,
            data: undefined,
            message: 'Notification deleted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Notification deletion failed',
            errors: [error.message]
        };
    }
};
exports.deleteNotificationService = deleteNotificationService;
/**
 * Get unread notification count
 */
const getUnreadNotificationCountService = async (userId) => {
    try {
        const count = await notification_model_1.default.countDocuments({ user: userId, isRead: false });
        return {
            success: true,
            data: count,
            message: 'Unread count retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to get unread count',
            errors: [error.message]
        };
    }
};
exports.getUnreadNotificationCountService = getUnreadNotificationCountService;
/**
 * Get notification statistics with caching
 */
const getNotificationStatsService = async (options = {}, cacheKey) => {
    try {
        if (cacheKey) {
            const cached = await (0, cache_1.getCache)(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: cached,
                    message: 'Notification stats retrieved from cache'
                };
            }
        }
        const { startDate, endDate, type } = options;
        const matchStage = {};
        if (startDate || endDate) {
            matchStage.createdAt = {};
            if (startDate)
                matchStage.createdAt.$gte = startDate;
            if (endDate)
                matchStage.createdAt.$lte = endDate;
        }
        if (type)
            matchStage.type = type;
        const stats = await notification_model_1.default.aggregate([
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
            await (0, cache_1.setCache)(cacheKey, responseData, 600);
        }
        return {
            success: true,
            data: responseData,
            message: 'Notification stats retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve notification stats',
            errors: [error.message]
        };
    }
};
exports.getNotificationStatsService = getNotificationStatsService;
// --- ENHANCED SERVICE FUNCTIONS (consolidated from notification.enhanced.ts) ---
/**
 * Get notifications with advanced filtering and sorting
 */
const getEnhancedNotifications = async (userId, options = {}) => {
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
        const query = { user: userId };
        if (isRead !== undefined)
            query.isRead = isRead;
        if (type)
            query.type = type;
        if (priority)
            query.priority = priority;
        if (relatedEntityId)
            query.relatedEntityId = relatedEntityId;
        if (!includeArchived)
            query.archived = { $ne: true };
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom)
                query.createdAt.$gte = dateFrom;
            if (dateTo)
                query.createdAt.$lte = dateTo;
        }
        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { title: { $regex: search, $options: 'i' } }
            ];
        }
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const notifications = await notification_model_1.default.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email avatar')
            .populate('relatedEntityId')
            .lean();
        const total = await notification_model_1.default.countDocuments(query);
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve notifications',
            errors: [error.message]
        };
    }
};
exports.getEnhancedNotifications = getEnhancedNotifications;
/**
 * Get notification analytics
 */
const getNotificationAnalytics = async (userId, options = {}) => {
    try {
        const { dateFrom, dateTo } = options;
        const dateFilter = { user: userId };
        if (dateFrom || dateTo) {
            dateFilter.createdAt = {};
            if (dateFrom)
                dateFilter.createdAt.$gte = dateFrom;
            if (dateTo)
                dateFilter.createdAt.$lte = dateTo;
        }
        const [total, unread] = await Promise.all([
            notification_model_1.default.countDocuments(dateFilter),
            notification_model_1.default.countDocuments({ ...dateFilter, isRead: false })
        ]);
        const typeAggregation = await notification_model_1.default.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        const byType = typeAggregation.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        const priorityAggregation = await notification_model_1.default.aggregate([
            { $match: { ...dateFilter, priority: { $exists: true } } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);
        const byPriority = priorityAggregation.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {});
        const recentActivityRaw = await notification_model_1.default.aggregate([
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
        const recentNotifications = await notification_model_1.default.countDocuments({
            ...dateFilter,
            createdAt: { $gte: oneDayAgo }
        });
        const readRecentNotifications = await notification_model_1.default.countDocuments({
            ...dateFilter,
            createdAt: { $gte: oneDayAgo },
            isRead: true
        });
        const engagementRate = recentNotifications > 0
            ? (readRecentNotifications / recentNotifications) * 100
            : 0;
        const responseTimeAggregation = await notification_model_1.default.aggregate([
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
        const analytics = {
            total,
            unread,
            byType,
            byPriority,
            recentActivity: recentActivityRaw.map((item) => ({
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve notification analytics',
            errors: [error.message]
        };
    }
};
exports.getNotificationAnalytics = getNotificationAnalytics;
/**
 * Mark notifications as read (bulk or all)
 */
const markNotificationsAsReadEnhanced = async (userId, notificationIds, markAll = false) => {
    try {
        const query = { user: userId, isRead: false };
        if (!markAll && notificationIds && notificationIds.length > 0) {
            query._id = { $in: notificationIds.map(id => new mongoose_1.Types.ObjectId(id)) };
        }
        const result = await notification_model_1.default.updateMany(query, { $set: { isRead: true, readAt: new Date() } });
        // OPTIMIZATION: Batch cache invalidation
        const cacheKeys = [
            `${NOTIFICATION_CACHE_BASE}:user=${userId}`,
            `${NOTIFICATION_CACHE_BASE}:unread=${userId}`
        ];
        Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        return {
            success: true,
            data: { modifiedCount: result.modifiedCount },
            message: `${result.modifiedCount} notifications marked as read`
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to mark notifications as read',
            errors: [error.message]
        };
    }
};
exports.markNotificationsAsReadEnhanced = markNotificationsAsReadEnhanced;
/**
 * Archive notifications
 */
const archiveNotifications = async (userId, notificationIds) => {
    try {
        const result = await notification_model_1.default.updateMany({ _id: { $in: notificationIds.map(id => new mongoose_1.Types.ObjectId(id)) }, user: userId }, { $set: { archived: true, archivedAt: new Date() } });
        // OPTIMIZATION: Non-blocking cache invalidation
        (0, cache_1.invalidateCache)(`${NOTIFICATION_CACHE_BASE}:user=${userId}`)
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        return {
            success: true,
            data: { modifiedCount: result.modifiedCount },
            message: `${result.modifiedCount} notifications archived`
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to archive notifications',
            errors: [error.message]
        };
    }
};
exports.archiveNotifications = archiveNotifications;
/**
 * Get notification preferences
 */
const getNotificationPreferences = async (userId) => {
    try {
        // OPTIMIZATION: Use lean query for better performance
        const user = await user_model_1.default.findById(userId).select('+notificationPreferences').lean();
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
        const preferences = user?.notificationPreferences || defaultPreferences;
        return {
            success: true,
            data: preferences,
            message: 'Notification preferences retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve notification preferences',
            errors: [error.message]
        };
    }
};
exports.getNotificationPreferences = getNotificationPreferences;
/**
 * Update notification preferences
 */
const updateNotificationPreferences = async (userId, preferences) => {
    try {
        await user_model_1.default.findByIdAndUpdate(userId, { $set: { notificationPreferences: preferences } });
        return {
            success: true,
            data: preferences,
            message: 'Notification preferences updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to update notification preferences',
            errors: [error.message]
        };
    }
};
exports.updateNotificationPreferences = updateNotificationPreferences;
// --- SPECIALIZED NOTIFICATION FUNCTIONS ---
/**
 * Send course update notification to all enrolled students
 */
const sendCourseUpdateNotification = async (courseId, updateType) => {
    // OPTIMIZATION: Use parallel queries with lean
    const [course, enrollments] = await Promise.all([
        course_model_1.default.findById(courseId).lean(),
        enrollment_model_1.default.find({ course: courseId }).lean()
    ]);
    if (!course || enrollments.length === 0)
        return [];
    const userIds = enrollments.map(enrollment => enrollment.student.toString());
    const result = await (0, exports.sendBulkNotificationService)(userIds, 'course_update', `Course "${course.title}" has been updated`, courseId);
    return result.success ? result.data : [];
};
exports.sendCourseUpdateNotification = sendCourseUpdateNotification;
/**
 * Send enrollment notification
 */
const sendEnrollmentNotification = async (userId, courseId) => {
    // OPTIMIZATION: Use lean query for better performance
    const course = await course_model_1.default.findById(courseId).lean();
    const result = await (0, exports.createNotificationService)(userId, 'enrollment', `Successfully enrolled in ${course?.title}`, courseId);
    return result.success ? result.data : null;
};
exports.sendEnrollmentNotification = sendEnrollmentNotification;
/**
 * Send course completion notification
 */
const sendCourseCompletionNotification = async (userId, courseId) => {
    // OPTIMIZATION: Use lean query for better performance
    const course = await course_model_1.default.findById(courseId).lean();
    const result = await (0, exports.createNotificationService)(userId, 'course_completion', `Congratulations! You've completed ${course?.title}`, courseId);
    return result.success ? result.data : null;
};
exports.sendCourseCompletionNotification = sendCourseCompletionNotification;
/**
 * Send new review notification to instructor
 */
const sendNewReviewNotification = async (instructorId, courseId, rating) => {
    // OPTIMIZATION: Use lean query for better performance
    const course = await course_model_1.default.findById(courseId).lean();
    const result = await (0, exports.createNotificationService)(instructorId, 'new_review', `New ${rating}-star review for ${course?.title}`, courseId);
    return result.success ? result.data : null;
};
exports.sendNewReviewNotification = sendNewReviewNotification;
/**
 * Send certificate earned notification
 */
const sendCertificateEarnedNotification = async (userId, courseId) => {
    // OPTIMIZATION: Use lean query for better performance
    const course = await course_model_1.default.findById(courseId).lean();
    const result = await (0, exports.createNotificationService)(userId, 'certificate_earned', `Certificate earned for completing ${course?.title}`, courseId);
    return result.success ? result.data : null;
};
exports.sendCertificateEarnedNotification = sendCertificateEarnedNotification;
/**
 * Send payment success notification
 */
const sendPaymentSuccessNotification = async (userId, courseId, amount) => {
    // OPTIMIZATION: Use lean query for better performance
    const course = await course_model_1.default.findById(courseId).lean();
    const result = await (0, exports.createNotificationService)(userId, 'payment_success', `Payment of $${amount} successful for ${course?.title}`, courseId);
    return result.success ? result.data : null;
};
exports.sendPaymentSuccessNotification = sendPaymentSuccessNotification;
/**
 * Send payment failed notification
 */
const sendPaymentFailedNotification = async (userId, courseId) => {
    // OPTIMIZATION: Use lean query for better performance
    const course = await course_model_1.default.findById(courseId).lean();
    const result = await (0, exports.createNotificationService)(userId, 'payment_failed', `Payment failed for ${course?.title}. Please try again.`, courseId);
    return result.success ? result.data : null;
};
exports.sendPaymentFailedNotification = sendPaymentFailedNotification;
//# sourceMappingURL=notification.service.js.map