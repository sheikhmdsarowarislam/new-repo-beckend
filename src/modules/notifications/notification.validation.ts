// src/modules/notifications/notification.validation.ts

import { z } from 'zod';

// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = z.string()
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
] as const;

// Create Notification Schema
export const createNotificationSchema = z.object({
  body: z.object({
    user: objectIdSchema.describe("User ID is required"),
    type: z.enum(notificationTypes),
    message: z.string()
      .min(1, "Message is required")
      .max(500, "Message cannot exceed 500 characters"),
    relatedEntityId: objectIdSchema.optional(),
  }),
});

// Notification ID Schema for params
export const notificationIdSchema = z.object({
  params: z.object({
    id: objectIdSchema.describe("Notification ID is required"),
  }),
});

// Send Bulk Notification Schema (admin only)
export const sendBulkNotificationSchema = z.object({
  body: z.object({
    userIds: z.array(objectIdSchema)
      .min(1, "At least one user ID is required")
      .max(1000, "Maximum 1000 users per bulk notification"),
    type: z.enum(notificationTypes),
    message: z.string()
      .min(1, "Message is required")
      .max(500, "Message cannot exceed 500 characters"),
    relatedEntityId: objectIdSchema.optional(),
  }),
});

// Get Notification Statistics Schema (admin only)
export const getNotificationStatsSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(notificationTypes).optional(),
  }).optional(),
});

// Type exports
export type ICreateNotificationBody = z.infer<typeof createNotificationSchema>['body'];
export type ISendBulkNotificationBody = z.infer<typeof sendBulkNotificationSchema>['body'];

// --------------------
// Enhanced schemas - Simplified to work with Express query params
// --------------------

export const getEnhancedNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    isRead: z.string().optional(),
    type: z.string().optional(),
    priority: z.enum(['high', 'normal', 'low']).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'type', 'isRead', 'priority']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    relatedEntityId: z.string().optional(),
    includeArchived: z.string().optional()
  }).optional()
});

export const notificationAnalyticsSchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional()
  }).optional()
});

export const notificationPreferencesSchema = z.object({
  body: z.object({
    email: z.object({
      courseUpdates: z.boolean().optional(),
      newReviews: z.boolean().optional(),
      courseCompletion: z.boolean().optional(),
      certificates: z.boolean().optional(),
      discussions: z.boolean().optional(),
      payments: z.boolean().optional()
    }).optional(),
    push: z.object({
      enabled: z.boolean().optional(),
      courseUpdates: z.boolean().optional(),
      newReviews: z.boolean().optional(),
      discussions: z.boolean().optional(),
      payments: z.boolean().optional()
    }).optional(),
    frequency: z.enum(['immediate', 'daily', 'weekly']).optional(),
    quietHours: z.object({
      enabled: z.boolean().optional(),
      start: z.string().optional(),
      end: z.string().optional()
    }).optional()
  })
});

export const markNotificationsAsReadSchema = z.object({
  body: z.object({
    notificationIds: z.array(z.string()).optional(),
    markAll: z.boolean().optional()
  })
});

export const archiveNotificationsSchema = z.object({
  body: z.object({
    notificationIds: z.array(z.string()).min(1, 'At least one notification ID is required')
  })
});

export const emptySchema = z.object({});
