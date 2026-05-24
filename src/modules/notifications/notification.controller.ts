// src/modules/notifications/notification.controller.ts

import { Response } from "express";
import * as notificationService from "./notification.service";
import { ICreateNotificationBody, ISendBulkNotificationBody } from "./notification.validation";
import { catchAsync } from "../../middlewares/catchAsync";
import { getUserId, getUserRole } from "../../utils/common";
import { sendSuccess, sendCreated, sendError } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

// --- Type Definitions ---
interface NotificationAuthRequest extends AuthRequest {
    cacheKey?: string;
    params: {
        id?: string;
    };
    query: {
        page?: string;
        limit?: string;
        isRead?: string;
        type?: string;
        startDate?: string;
        endDate?: string;
    };
    body: any; 
}

interface NotificationAnalyticsRequest extends AuthRequest {
  query: {
    dateFrom?: string;
    dateTo?: string;
  };
  params: {
    userId?: string;
  };
}

interface NotificationPreferencesRequest extends AuthRequest {
  body: {
    email?: {
      courseUpdates?: boolean;
      newReviews?: boolean;
      courseCompletion?: boolean;
      certificates?: boolean;
      discussions?: boolean;
      payments?: boolean;
    };
    push?: {
      enabled?: boolean;
      courseUpdates?: boolean;
      newReviews?: boolean;
      discussions?: boolean;
      payments?: boolean;
    };
    frequency?: 'immediate' | 'daily' | 'weekly';
    quietHours?: {
      enabled?: boolean;
      start?: string;
      end?: string;
    };
  };
}

// --- ENHANCED CONTROLLER HANDLERS ---

export const createNotificationHandler = catchAsync(async (req: NotificationAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    // Only admins can create notifications manually
    if (userRole !== 'admin') {
        return sendError(res, 'Insufficient permissions', 403);
    }

    const { user, type, message, relatedEntityId } = req.body as ICreateNotificationBody;
    const result = await notificationService.createNotificationService(
        user, 
        type, 
        message, 
        relatedEntityId
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Notification creation failed', 400, result.errors);
    }
    
    return sendCreated(res, result.data, 'Notification created successfully');
});

export const deleteNotificationHandler = catchAsync(async (req: NotificationAuthRequest, res: Response) => {
    const userId = getUserId(req);
    
    if (!req.params.id) {
        return sendError(res, 'Notification ID missing', 400);
    }

    const result = await notificationService.deleteNotificationService(
        req.params.id, 
        userId
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to delete notification', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Notification deleted successfully');
});

export const getUnreadCountHandler = catchAsync(async (req: NotificationAuthRequest, res: Response) => {
    const userId = getUserId(req);

    const result = await notificationService.getUnreadNotificationCountService(userId);
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve unread count', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Unread count retrieved successfully');
});

export const sendBulkNotificationHandler = catchAsync(async (req: NotificationAuthRequest, res: Response) => {
    const userRole = getUserRole(req);
    
    // Only admins can send bulk notifications
    if (userRole !== 'admin') {
        return sendError(res, 'Insufficient permissions', 403);
    }

    const { userIds, type, message, relatedEntityId } = req.body as ISendBulkNotificationBody;
    const result = await notificationService.sendBulkNotificationService(
        userIds, 
        type, 
        message, 
        relatedEntityId
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Bulk notification failed', 400, result.errors);
    }
    
    return sendCreated(res, result.data, 'Bulk notifications sent successfully');
});

export const getNotificationStatsHandler = catchAsync(async (req: NotificationAuthRequest, res: Response) => {
    const userRole = getUserRole(req);
    
    // Only admins can view stats
    if (userRole !== 'admin') {
        return sendError(res, 'Insufficient permissions', 403);
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
        return sendError(res, result.message || 'Failed to retrieve notification stats', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Notification stats retrieved successfully', 200, { cached: !!cacheKey });
});

// --- Analytics and Preferences Handlers ---

export const getNotificationAnalyticsHandler = catchAsync(async (req: NotificationAnalyticsRequest, res: Response) => {
  const userId = getUserId(req);
  const { dateFrom, dateTo } = req.query;
  const targetUserId = req.params.userId || userId;

  const result = await notificationService.getNotificationAnalytics(targetUserId, {
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined
  });

  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve analytics', 400, result.errors);
  }

  return sendSuccess(res, result.data, 'Analytics retrieved successfully');
});

export const getNotificationPreferencesHandler = catchAsync(async (req: NotificationAnalyticsRequest, res: Response) => {
  const userId = getUserId(req);

  const result = await notificationService.getNotificationPreferences(userId);

  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve preferences', 400, result.errors);
  }

  return sendSuccess(res, result.data, 'Notification preferences retrieved successfully');
});

export const updateNotificationPreferencesHandler = catchAsync(async (req: NotificationPreferencesRequest, res: Response) => {
  const userId = getUserId(req);
  const preferences = req.body;

  const result = await notificationService.updateNotificationPreferences(userId, preferences);

  if (!result.success) {
    return sendError(res, result.message || 'Failed to update preferences', 400, result.errors);
  }

  return sendSuccess(res, result.data, 'Notification preferences updated successfully');
});

// --- Enhanced Notification Handlers ---

export const getEnhancedNotificationsHandler = catchAsync(async (req: any, res: Response) => {
  const userId = getUserId(req);

  const result = await notificationService.getEnhancedNotifications(userId, req.query);

  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve enhanced notifications', 400, result.errors);
  }

  return res.status(200).json({
    success: true,
    message: result.message,
    data: result.data?.notifications,
    meta: result.data?.pagination,
    filters: result.data?.filters
  });
});

export const markNotificationsAsReadEnhancedHandler = catchAsync(async (req: any, res: Response) => {
  const userId = getUserId(req);
  const { notificationIds, markAll = false } = req.body;

  const result = await notificationService.markNotificationsAsReadEnhanced(userId, notificationIds, markAll);

  if (!result.success) {
    return sendError(res, result.message || 'Failed to mark notifications as read', 400, result.errors);
  }

  return sendSuccess(res, result.data, 'Notifications marked as read successfully');
});

export const archiveNotificationsHandler = catchAsync(async (req: any, res: Response) => {
  const userId = getUserId(req);
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
    return sendError(res, 'Notification IDs are required', 400);
  }

  const result = await notificationService.archiveNotifications(userId, notificationIds);

  if (!result.success) {
    return sendError(res, result.message || 'Failed to archive notifications', 400, result.errors);
  }

  return sendSuccess(res, result.data, 'Notifications archived successfully');
});