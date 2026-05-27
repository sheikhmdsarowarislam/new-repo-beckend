"use strict";
// src/modules/notifications/notification.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const notification_controller_1 = require("./notification.controller");
const notification_validation_1 = require("./notification.validation");
const notification_validation_2 = require("./notification.validation");
const router = (0, express_1.Router)();
// --- ENHANCED NOTIFICATION ROUTES ---
// POST create notification (admin only)
router.post("/", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('notification:create'), (0, validate_middleware_1.validate)(notification_validation_1.createNotificationSchema), notification_controller_1.createNotificationHandler);
// POST send bulk notifications (admin only)
router.post("/bulk", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('notification:create'), (0, validate_middleware_1.validate)(notification_validation_1.sendBulkNotificationSchema), notification_controller_1.sendBulkNotificationHandler);
// GET user's notifications with advanced filtering
router.get("/", auth_1.isAuthenticated, notification_controller_1.getEnhancedNotificationsHandler);
// GET unread count
router.get("/unread/count", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(notification_validation_2.getEnhancedNotificationsSchema), notification_controller_1.getUnreadCountHandler);
// GET notification statistics (admin only)
router.get("/stats", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(notification_validation_1.getNotificationStatsSchema), notification_controller_1.getNotificationStatsHandler);
// GET notification analytics
router.get("/analytics", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(notification_validation_2.notificationAnalyticsSchema), notification_controller_1.getNotificationAnalyticsHandler);
router.get("/analytics/:userId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(notification_validation_2.notificationAnalyticsSchema), notification_controller_1.getNotificationAnalyticsHandler);
// GET notification preferences
router.get("/preferences", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(notification_validation_2.emptySchema), notification_controller_1.getNotificationPreferencesHandler);
// PATCH update notification preferences
router.patch("/preferences", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('notification:update'), (0, validate_middleware_1.validate)(notification_validation_2.notificationPreferencesSchema), notification_controller_1.updateNotificationPreferencesHandler);
// PATCH mark notifications as read (enhanced)
router.patch("/read", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('notification:update'), (0, validate_middleware_1.validate)(notification_validation_2.markNotificationsAsReadSchema), notification_controller_1.markNotificationsAsReadEnhancedHandler);
// PATCH archive notifications
router.patch("/archive", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('notification:update'), (0, validate_middleware_1.validate)(notification_validation_2.archiveNotificationsSchema), notification_controller_1.archiveNotificationsHandler);
// DELETE notification
router.delete("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('notification:delete'), (0, validate_middleware_1.validate)(notification_validation_1.notificationIdSchema), notification_controller_1.deleteNotificationHandler);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map