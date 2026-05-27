import { INotification } from "./notification.model";
import { ServiceResponse } from "../../@types/api";
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
/**
 * Create a single notification
 */
export declare const createNotificationService: (userId: string, type: string, message: string, relatedEntityId?: string) => Promise<ServiceResponse<INotification>>;
/**
 * Create notification (alias for backwards compatibility)
 */
export declare const createNotification: (userId: string, type: string, message: string, relatedEntityId?: string) => Promise<ServiceResponse<INotification>>;
/**
 * Send bulk notifications
 */
export declare const sendBulkNotificationService: (userIds: string[], type: string, message: string, relatedEntityId?: string) => Promise<ServiceResponse<INotification[]>>;
/**
 * Get user notifications with caching
 */
export declare const getUserNotificationsService: (userId: string, options: any | undefined, cacheKey: string) => Promise<ServiceResponse<any>>;
/**
 * Mark notification as read
 */
export declare const markNotificationAsReadService: (notificationId: string, userId: string) => Promise<ServiceResponse<INotification>>;
/**
 * Mark all notifications as read
 */
export declare const markAllNotificationsAsReadService: (userId: string) => Promise<ServiceResponse<any>>;
/**
 * Delete notification
 */
export declare const deleteNotificationService: (notificationId: string, userId: string) => Promise<ServiceResponse<any>>;
/**
 * Get unread notification count
 */
export declare const getUnreadNotificationCountService: (userId: string) => Promise<ServiceResponse<number>>;
/**
 * Get notification statistics with caching
 */
export declare const getNotificationStatsService: (options: any | undefined, cacheKey: string) => Promise<ServiceResponse<any>>;
/**
 * Get notifications with advanced filtering and sorting
 */
export declare const getEnhancedNotifications: (userId: string, options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get notification analytics
 */
export declare const getNotificationAnalytics: (userId: string, options?: {
    dateFrom?: Date;
    dateTo?: Date;
}) => Promise<ServiceResponse<NotificationAnalytics>>;
/**
 * Mark notifications as read (bulk or all)
 */
export declare const markNotificationsAsReadEnhanced: (userId: string, notificationIds?: string[], markAll?: boolean) => Promise<ServiceResponse<any>>;
/**
 * Archive notifications
 */
export declare const archiveNotifications: (userId: string, notificationIds: string[]) => Promise<ServiceResponse<any>>;
/**
 * Get notification preferences
 */
export declare const getNotificationPreferences: (userId: string) => Promise<ServiceResponse<any>>;
/**
 * Update notification preferences
 */
export declare const updateNotificationPreferences: (userId: string, preferences: any) => Promise<ServiceResponse<any>>;
/**
 * Send course update notification to all enrolled students
 */
export declare const sendCourseUpdateNotification: (courseId: string, updateType: string) => Promise<INotification[]>;
/**
 * Send enrollment notification
 */
export declare const sendEnrollmentNotification: (userId: string, courseId: string) => Promise<INotification>;
/**
 * Send course completion notification
 */
export declare const sendCourseCompletionNotification: (userId: string, courseId: string) => Promise<INotification>;
/**
 * Send new review notification to instructor
 */
export declare const sendNewReviewNotification: (instructorId: string, courseId: string, rating: number) => Promise<INotification>;
/**
 * Send certificate earned notification
 */
export declare const sendCertificateEarnedNotification: (userId: string, courseId: string) => Promise<INotification>;
/**
 * Send payment success notification
 */
export declare const sendPaymentSuccessNotification: (userId: string, courseId: string, amount: number) => Promise<INotification>;
/**
 * Send payment failed notification
 */
export declare const sendPaymentFailedNotification: (userId: string, courseId: string) => Promise<INotification>;
export {};
//# sourceMappingURL=notification.service.d.ts.map