// src/modules/notifications/notification.routes.ts

import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createNotificationHandler,
  deleteNotificationHandler,
  getUnreadCountHandler,
  sendBulkNotificationHandler,
  getNotificationStatsHandler,
  getNotificationAnalyticsHandler,
  getNotificationPreferencesHandler,
  updateNotificationPreferencesHandler,
  getEnhancedNotificationsHandler,
  markNotificationsAsReadEnhancedHandler,
  archiveNotificationsHandler
} from "./notification.controller";
import {
  createNotificationSchema,
  notificationIdSchema,
  sendBulkNotificationSchema,
  getNotificationStatsSchema,
} from "./notification.validation";
import {
  getEnhancedNotificationsSchema,
  notificationAnalyticsSchema,
  notificationPreferencesSchema,
  markNotificationsAsReadSchema,
  archiveNotificationsSchema,
  emptySchema
} from "./notification.validation";

const router = Router();

// --- ENHANCED NOTIFICATION ROUTES ---

// POST create notification (admin only)
router.post(
  "/", 
  isAuthenticated,
    rbac('notification:create'),
    validate(createNotificationSchema), 
  createNotificationHandler
);

// POST send bulk notifications (admin only)
router.post(
  "/bulk", 
  isAuthenticated,
    rbac('notification:create'),
    validate(sendBulkNotificationSchema), 
  sendBulkNotificationHandler
);

// GET user's notifications with advanced filtering
router.get(
  "/", 
  isAuthenticated,
  getEnhancedNotificationsHandler
);

// GET unread count
router.get(
  "/unread/count", 
  isAuthenticated,
    validate(getEnhancedNotificationsSchema),
  getUnreadCountHandler
);

// GET notification statistics (admin only)
router.get(
  "/stats", 
  isAuthenticated,
    validate(getNotificationStatsSchema),
  getNotificationStatsHandler
);

// GET notification analytics
router.get(
  "/analytics",
  isAuthenticated,
    validate(notificationAnalyticsSchema),
  getNotificationAnalyticsHandler
);

router.get(
  "/analytics/:userId",
  isAuthenticated,
    validate(notificationAnalyticsSchema),
  getNotificationAnalyticsHandler
);

// GET notification preferences
router.get(
  "/preferences",
  isAuthenticated,
    validate(emptySchema),
  getNotificationPreferencesHandler
);

// PATCH update notification preferences
router.patch(
  "/preferences",
  isAuthenticated,
    rbac('notification:update'),
    validate(notificationPreferencesSchema),
  updateNotificationPreferencesHandler
);

// PATCH mark notifications as read (enhanced)
router.patch(
  "/read",
  isAuthenticated,
    rbac('notification:update'),
    validate(markNotificationsAsReadSchema),
  markNotificationsAsReadEnhancedHandler
);

// PATCH archive notifications
router.patch(
  "/archive",
  isAuthenticated,
    rbac('notification:update'),
    validate(archiveNotificationsSchema),
  archiveNotificationsHandler
);

// DELETE notification
router.delete(
  "/:id", 
  isAuthenticated,
    rbac('notification:delete'),
    validate(notificationIdSchema),
  deleteNotificationHandler
);

export default router;