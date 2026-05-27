"use strict";
// src/modules/notifications/notification.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptySchema = exports.archiveNotificationsSchema = exports.markNotificationsAsReadSchema = exports.notificationPreferencesSchema = exports.notificationAnalyticsSchema = exports.getEnhancedNotificationsSchema = exports.getNotificationStatsSchema = exports.sendBulkNotificationSchema = exports.notificationIdSchema = exports.createNotificationSchema = void 0;
const zod_1 = require("zod");
// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = zod_1.z.string()
    .nonempty('ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');
// Notification types enum
const notificationTypes = [
    'course_update',
    'new_review',
    'quiz_grade',
    'announcement',
    'enrollment',
    'course_completion',
    'certificate_earned',
    'payment_success',
    'payment_failed'
];
// Create Notification Schema
exports.createNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        user: objectIdSchema.describe("User ID is required"),
        type: zod_1.z.enum(notificationTypes),
        message: zod_1.z.string()
            .min(1, "Message is required")
            .max(500, "Message cannot exceed 500 characters"),
        relatedEntityId: objectIdSchema.optional(),
    }),
});
// Notification ID Schema for params
exports.notificationIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema.describe("Notification ID is required"),
    }),
});
// Send Bulk Notification Schema (admin only)
exports.sendBulkNotificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userIds: zod_1.z.array(objectIdSchema)
            .min(1, "At least one user ID is required")
            .max(1000, "Maximum 1000 users per bulk notification"),
        type: zod_1.z.enum(notificationTypes),
        message: zod_1.z.string()
            .min(1, "Message is required")
            .max(500, "Message cannot exceed 500 characters"),
        relatedEntityId: objectIdSchema.optional(),
    }),
});
// Get Notification Statistics Schema (admin only)
exports.getNotificationStatsSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        type: zod_1.z.enum(notificationTypes).optional(),
    }).optional(),
});
// --------------------
// Enhanced schemas - Simplified to work with Express query params
// --------------------
exports.getEnhancedNotificationsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        isRead: zod_1.z.string().optional(),
        type: zod_1.z.string().optional(),
        priority: zod_1.z.enum(['high', 'normal', 'low']).optional(),
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['createdAt', 'type', 'isRead', 'priority']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
        relatedEntityId: zod_1.z.string().optional(),
        includeArchived: zod_1.z.string().optional()
    }).optional()
});
exports.notificationAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        dateFrom: zod_1.z.string().optional(),
        dateTo: zod_1.z.string().optional()
    }).optional()
});
exports.notificationPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.object({
            courseUpdates: zod_1.z.boolean().optional(),
            newReviews: zod_1.z.boolean().optional(),
            courseCompletion: zod_1.z.boolean().optional(),
            certificates: zod_1.z.boolean().optional(),
            discussions: zod_1.z.boolean().optional(),
            payments: zod_1.z.boolean().optional()
        }).optional(),
        push: zod_1.z.object({
            enabled: zod_1.z.boolean().optional(),
            courseUpdates: zod_1.z.boolean().optional(),
            newReviews: zod_1.z.boolean().optional(),
            discussions: zod_1.z.boolean().optional(),
            payments: zod_1.z.boolean().optional()
        }).optional(),
        frequency: zod_1.z.enum(['immediate', 'daily', 'weekly']).optional(),
        quietHours: zod_1.z.object({
            enabled: zod_1.z.boolean().optional(),
            start: zod_1.z.string().optional(),
            end: zod_1.z.string().optional()
        }).optional()
    })
});
exports.markNotificationsAsReadSchema = zod_1.z.object({
    body: zod_1.z.object({
        notificationIds: zod_1.z.array(zod_1.z.string()).optional(),
        markAll: zod_1.z.boolean().optional()
    })
});
exports.archiveNotificationsSchema = zod_1.z.object({
    body: zod_1.z.object({
        notificationIds: zod_1.z.array(zod_1.z.string()).min(1, 'At least one notification ID is required')
    })
});
exports.emptySchema = zod_1.z.object({});
//# sourceMappingURL=notification.validation.js.map