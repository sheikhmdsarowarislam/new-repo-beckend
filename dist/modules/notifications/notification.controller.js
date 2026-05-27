"use strict";
// src/modules/notifications/notification.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.archiveNotificationsHandler = exports.markNotificationsAsReadEnhancedHandler = exports.getEnhancedNotificationsHandler = exports.updateNotificationPreferencesHandler = exports.getNotificationPreferencesHandler = exports.getNotificationAnalyticsHandler = exports.getNotificationStatsHandler = exports.sendBulkNotificationHandler = exports.getUnreadCountHandler = exports.deleteNotificationHandler = exports.createNotificationHandler = void 0;
const notificationService = __importStar(require("./notification.service"));
const catchAsync_1 = require("../../middlewares/catchAsync");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// --- ENHANCED CONTROLLER HANDLERS ---
exports.createNotificationHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can create notifications manually
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const { user, type, message, relatedEntityId } = req.body;
    const result = await notificationService.createNotificationService(user, type, message, relatedEntityId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Notification creation failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, result.data, 'Notification created successfully');
});
exports.deleteNotificationHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    if (!req.params.id) {
        return (0, response_1.sendError)(res, 'Notification ID missing', 400);
    }
    const result = await notificationService.deleteNotificationService(req.params.id, userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to delete notification', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Notification deleted successfully');
});
exports.getUnreadCountHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await notificationService.getUnreadNotificationCountService(userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve unread count', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Unread count retrieved successfully');
});
exports.sendBulkNotificationHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can send bulk notifications
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const { userIds, type, message, relatedEntityId } = req.body;
    const result = await notificationService.sendBulkNotificationService(userIds, type, message, relatedEntityId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Bulk notification failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, result.data, 'Bulk notifications sent successfully');
});
exports.getNotificationStatsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can view stats
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const cacheKey = req.cacheKey || 'notification-stats';
    const { startDate, endDate, type } = req.query;
    const options = {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        type
    };
    const result = await notificationService.getNotificationStatsService(options, cacheKey);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve notification stats', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Notification stats retrieved successfully', 200, { cached: !!cacheKey });
});
// --- Analytics and Preferences Handlers ---
exports.getNotificationAnalyticsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { dateFrom, dateTo } = req.query;
    const targetUserId = req.params.userId || userId;
    const result = await notificationService.getNotificationAnalytics(targetUserId, {
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined
    });
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve analytics', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Analytics retrieved successfully');
});
exports.getNotificationPreferencesHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await notificationService.getNotificationPreferences(userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve preferences', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Notification preferences retrieved successfully');
});
exports.updateNotificationPreferencesHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const preferences = req.body;
    const result = await notificationService.updateNotificationPreferences(userId, preferences);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to update preferences', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Notification preferences updated successfully');
});
// --- Enhanced Notification Handlers ---
exports.getEnhancedNotificationsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await notificationService.getEnhancedNotifications(userId, req.query);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve enhanced notifications', 400, result.errors);
    }
    return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data?.notifications,
        meta: result.data?.pagination,
        filters: result.data?.filters
    });
});
exports.markNotificationsAsReadEnhancedHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { notificationIds, markAll = false } = req.body;
    const result = await notificationService.markNotificationsAsReadEnhanced(userId, notificationIds, markAll);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to mark notifications as read', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Notifications marked as read successfully');
});
exports.archiveNotificationsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { notificationIds } = req.body;
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
        return (0, response_1.sendError)(res, 'Notification IDs are required', 400);
    }
    const result = await notificationService.archiveNotifications(userId, notificationIds);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to archive notifications', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Notifications archived successfully');
});
//# sourceMappingURL=notification.controller.js.map