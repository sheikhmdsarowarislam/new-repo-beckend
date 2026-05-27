import { z } from 'zod';
export declare const CreateLectureBodySchema: z.ZodObject<{
    title: z.ZodString;
    course: z.ZodString;
    chapter: z.ZodString;
    videoUrl: z.ZodString;
    duration: z.ZodNumber;
    order: z.ZodOptional<z.ZodNumber>;
    isPreview: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    resources: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CreateLecturePayload = z.infer<typeof CreateLectureBodySchema>;
export declare const UpdateLectureBodySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    course: z.ZodOptional<z.ZodString>;
    videoUrl: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    isPreview: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    resources: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    chapter: z.ZodOptional<z.ZodString>;
    order: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export type UpdateLecturePayload = z.infer<typeof UpdateLectureBodySchema>;
export declare const CreateLectureSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        course: z.ZodString;
        chapter: z.ZodString;
        videoUrl: z.ZodString;
        duration: z.ZodNumber;
        order: z.ZodOptional<z.ZodNumber>;
        isPreview: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
        resources: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const UpdateLectureSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        course: z.ZodOptional<z.ZodString>;
        videoUrl: z.ZodOptional<z.ZodString>;
        duration: z.ZodOptional<z.ZodNumber>;
        isPreview: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
        resources: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        chapter: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const IdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ReorderItemSchema: z.ZodObject<{
    lectureId: z.ZodString;
    newOrder: z.ZodNumber;
}, z.core.$strip>;
export type ReorderItem = z.infer<typeof ReorderItemSchema>;
export declare const ReorderLecturesSchema: z.ZodObject<{
    body: z.ZodObject<{
        chapterId: z.ZodString;
        reorderData: z.ZodArray<z.ZodObject<{
            lectureId: z.ZodString;
            newOrder: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ReorderLecturesPayload = z.infer<typeof ReorderLecturesSchema>['body'];
//# sourceMappingURL=lecture.validation.d.ts.map