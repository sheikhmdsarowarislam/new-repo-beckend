import { z } from 'zod';
export declare const createDiscussionSchema: z.ZodObject<{
    body: z.ZodObject<{
        lecture: z.ZodString;
        question: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const answerDiscussionSchema: z.ZodObject<{
    body: z.ZodObject<{
        text: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateDiscussionSchema: z.ZodObject<{
    body: z.ZodObject<{
        question: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const discussionIdSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getLectureDiscussionsSchema: z.ZodObject<{
    params: z.ZodObject<{
        lectureId: z.ZodString;
    }, z.core.$strip>;
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getCourseDiscussionsSchema: z.ZodObject<{
    params: z.ZodObject<{
        courseId: z.ZodString;
    }, z.core.$strip>;
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getUserDiscussionsSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$loose>;
export type ICreateDiscussionBody = z.infer<typeof createDiscussionSchema>['body'];
export type IAnswerDiscussionBody = z.infer<typeof answerDiscussionSchema>['body'];
export type IUpdateDiscussionBody = z.infer<typeof updateDiscussionSchema>['body'];
//# sourceMappingURL=discussion.validation.d.ts.map