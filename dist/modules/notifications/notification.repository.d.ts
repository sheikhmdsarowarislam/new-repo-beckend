import { ClientSession } from 'mongoose';
import { INotification } from './notification.model';
export declare const findNotificationById: (notificationId: string, session?: ClientSession) => Promise<any>;
export declare const findNotificationsByUser: (userId: string, options?: any, session?: ClientSession) => Promise<any[]>;
export declare const findUnreadNotificationsByUser: (userId: string, session?: ClientSession) => Promise<any[]>;
export declare const countNotificationsByUser: (userId: string, isRead?: boolean, session?: ClientSession) => Promise<number>;
export declare const countUnreadNotificationsByUser: (userId: string, session?: ClientSession) => Promise<number>;
export declare const createNotification: (data: Partial<INotification>, session?: ClientSession) => Promise<INotification>;
export declare const createBulkNotifications: (notifications: Partial<INotification>[], session?: ClientSession) => Promise<INotification[]>;
export declare const updateNotificationById: (notificationId: string, updateData: Partial<INotification>, session?: ClientSession) => Promise<INotification | null>;
export declare const markNotificationAsRead: (notificationId: string, userId: string, session?: ClientSession) => Promise<INotification | null>;
export declare const markAllNotificationsAsRead: (userId: string, session?: ClientSession) => Promise<any>;
export declare const deleteNotificationById: (notificationId: string, session?: ClientSession) => Promise<INotification | null>;
export declare const deleteNotificationByUserAndId: (notificationId: string, userId: string, session?: ClientSession) => Promise<INotification | null>;
export declare const bulkDeleteNotificationsByUser: (userId: string, session?: ClientSession) => Promise<void>;
export declare const bulkDeleteOldNotifications: (daysOld?: number, session?: ClientSession) => Promise<void>;
export declare const bulkMarkNotificationsAsRead: (notificationIds: string[], userId: string, session?: ClientSession) => Promise<any>;
export declare const aggregateUserNotificationStats: (userId: string) => Promise<any>;
//# sourceMappingURL=notification.repository.d.ts.map