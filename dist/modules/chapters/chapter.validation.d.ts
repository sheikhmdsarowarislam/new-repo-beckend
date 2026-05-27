import { z } from 'zod';
export declare const createChapterSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        course: z.ZodString;
        order: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateChapterSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        order: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getChapterSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getCourseChaptersSchema: z.ZodObject<{
    params: z.ZodObject<{
        courseId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const reorderChaptersSchema: z.ZodObject<{
    body: z.ZodObject<{
        courseId: z.ZodString;
        order: z.ZodArray<z.ZodObject<{
            chapterId: z.ZodString;
            order: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const reorderChapterContentSchema: z.ZodObject<{
    params: z.ZodObject<{
        chapterId: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            itemId: z.ZodString;
            itemType: z.ZodEnum<{
                lecture: "lecture";
                quiz: "quiz";
            }>;
            order: z.ZodNumber;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=chapter.validation.d.ts.map