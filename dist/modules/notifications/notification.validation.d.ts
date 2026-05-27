import { z } from 'zod';
export declare const createNotificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        user: z.ZodString;
        type: z.ZodEnum<{
            enrollment: "enrollment";
            course_update: "course_update";
            new_review: "new_review";
            quiz_grade: "quiz_grade";
            announcement: "announcement";
            course_completion: "course_completion";
            certificate_earned: "certificate_earned";
            payment_success: "payment_success";
            payment_failed: "payment_failed";
        }>;
        message: z.ZodString;
        relatedEntityId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const notificationIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const sendBulkNotificationSchema: z.ZodObject<{
    body: z.ZodObject<{
        userIds: z.ZodArray<z.ZodString>;
        type: z.ZodEnum<{
            enrollment: "enrollment";
            course_update: "course_update";
            new_review: "new_review";
            quiz_grade: "quiz_grade";
            announcement: "announcement";
            course_completion: "course_completion";
            certificate_earned: "certificate_earned";
            payment_success: "payment_success";
            payment_failed: "payment_failed";
        }>;
        message: z.ZodString;
        relatedEntityId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getNotificationStatsSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<{
            enrollment: "enrollment";
            course_update: "course_update";
            new_review: "new_review";
            quiz_grade: "quiz_grade";
            announcement: "announcement";
            course_completion: "course_completion";
            certificate_earned: "certificate_earned";
            payment_success: "payment_success";
            payment_failed: "payment_failed";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ICreateNotificationBody = z.infer<typeof createNotificationSchema>['body'];
export type ISendBulkNotificationBody = z.infer<typeof sendBulkNotificationSchema>['body'];
export declare const getEnhancedNotificationsSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
        isRead: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        priority: z.ZodOptional<z.ZodEnum<{
            high: "high";
            normal: "normal";
            low: "low";
        }>>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodOptional<z.ZodEnum<{
            type: "type";
            priority: "priority";
            createdAt: "createdAt";
            isRead: "isRead";
        }>>;
        sortOrder: z.ZodOptional<z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>>;
        relatedEntityId: z.ZodOptional<z.ZodString>;
        includeArchived: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const notificationAnalyticsSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const notificationPreferencesSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodOptional<z.ZodObject<{
            courseUpdates: z.ZodOptional<z.ZodBoolean>;
            newReviews: z.ZodOptional<z.ZodBoolean>;
            courseCompletion: z.ZodOptional<z.ZodBoolean>;
            certificates: z.ZodOptional<z.ZodBoolean>;
            discussions: z.ZodOptional<z.ZodBoolean>;
            payments: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
        push: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            courseUpdates: z.ZodOptional<z.ZodBoolean>;
            newReviews: z.ZodOptional<z.ZodBoolean>;
            discussions: z.ZodOptional<z.ZodBoolean>;
            payments: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
        frequency: z.ZodOptional<z.ZodEnum<{
            immediate: "immediate";
            daily: "daily";
            weekly: "weekly";
        }>>;
        quietHours: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodOptional<z.ZodBoolean>;
            start: z.ZodOptional<z.ZodString>;
            end: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const markNotificationsAsReadSchema: z.ZodObject<{
    body: z.ZodObject<{
        notificationIds: z.ZodOptional<z.ZodArray<z.ZodString>>;
        markAll: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const archiveNotificationsSchema: z.ZodObject<{
    body: z.ZodObject<{
        notificationIds: z.ZodArray<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const emptySchema: z.ZodObject<{}, z.core.$strip>;
//# sourceMappingURL=notification.validation.d.ts.map