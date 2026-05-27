import { z } from 'zod';
export declare const getAllCoursesSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const createCourseSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        category: z.ZodString;
        price: z.ZodNumber;
        discount: z.ZodOptional<z.ZodNumber>;
        thumbnail: z.ZodOptional<z.ZodString>;
        stacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
        level: z.ZodOptional<z.ZodEnum<{
            beginner: "beginner";
            intermediate: "intermediate";
            advanced: "advanced";
        }>>;
        requirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
        whatYouWillLearn: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateCourseSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        discount: z.ZodOptional<z.ZodNumber>;
        thumbnail: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<{
            draft: "draft";
            published: "published";
            archived: "archived";
        }>>;
        stacks: z.ZodOptional<z.ZodArray<z.ZodString>>;
        level: z.ZodOptional<z.ZodEnum<{
            beginner: "beginner";
            intermediate: "intermediate";
            advanced: "advanced";
        }>>;
        requirements: z.ZodOptional<z.ZodArray<z.ZodString>>;
        whatYouWillLearn: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getCourseSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getInstructorCoursesSchema: z.ZodObject<{
    params: z.ZodObject<{
        instructorId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=course.validation.d.ts.map