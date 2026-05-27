import { z } from 'zod';
export declare const createReviewSchema: z.ZodObject<{
    body: z.ZodObject<{
        course: z.ZodString;
        rating: z.ZodNumber;
        comment: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateReviewSchema: z.ZodObject<{
    body: z.ZodObject<{
        rating: z.ZodOptional<z.ZodNumber>;
        comment: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const reviewIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getCourseReviewsSchema: z.ZodObject<{
    params: z.ZodObject<{
        courseId: z.ZodString;
    }, z.core.$strip>;
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodOptional<z.ZodEnum<{
            createdAt: "createdAt";
            rating: "rating";
        }>>;
        sortOrder: z.ZodOptional<z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getCourseReviewStatsSchema: z.ZodObject<{
    params: z.ZodObject<{
        courseId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getUserReviewsSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getInstructorReviewsSchema: z.ZodObject<{
    params: z.ZodObject<{
        instructorId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ICreateReviewBody = z.infer<typeof createReviewSchema>['body'];
export type IUpdateReviewBody = z.infer<typeof updateReviewSchema>['body'];
//# sourceMappingURL=review.validation.d.ts.map