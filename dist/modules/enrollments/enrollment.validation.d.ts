import { z } from "zod";
export declare const submitPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        courseId: z.ZodString;
        transactionId: z.ZodString;
        couponCode: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const approveRejectSchema: z.ZodObject<{
    params: z.ZodObject<{
        enrollmentId: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodOptional<z.ZodObject<{
        reason: z.ZodOptional<z.ZodString>;
        validityDays: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const getUserEnrolledCoursesSchema: z.ZodObject<{
    params: z.ZodObject<{
        userId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getEnrolledCourseDetailsSchema: z.ZodObject<{
    params: z.ZodObject<{
        courseId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getStudentsByInstructorSchema: z.ZodObject<{
    params: z.ZodObject<{
        instructorId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getInstructorStatsSchema: z.ZodObject<{
    params: z.ZodObject<{
        instructorId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=enrollment.validation.d.ts.map