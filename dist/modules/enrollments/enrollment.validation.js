"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructorStatsSchema = exports.getStudentsByInstructorSchema = exports.getEnrolledCourseDetailsSchema = exports.getUserEnrolledCoursesSchema = exports.approveRejectSchema = exports.submitPaymentSchema = void 0;
const zod_1 = require("zod");
exports.submitPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: zod_1.z.string().min(1, "Course ID is required."),
        transactionId: zod_1.z
            .string()
            .min(1, "Transaction ID or mobile number is required.")
            .max(100, "Transaction ID too long."),
        couponCode: zod_1.z.string().optional(),
    }),
});
exports.approveRejectSchema = zod_1.z.object({
    params: zod_1.z.object({
        enrollmentId: zod_1.z.string().min(1, "Enrollment ID is required."),
    }),
    body: zod_1.z
        .object({
        reason: zod_1.z.string().max(500).optional(),
        validityDays: zod_1.z.number().int().min(1).max(1825).optional(), // 1 day to 5 years
    })
        .optional(),
});
exports.getUserEnrolledCoursesSchema = zod_1.z.object({
    params: zod_1.z.object({
        userId: zod_1.z.string().min(1, "User ID is required."),
    }),
});
exports.getEnrolledCourseDetailsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: zod_1.z.string().min(1, "Course ID is required."),
    }),
});
exports.getStudentsByInstructorSchema = zod_1.z.object({
    params: zod_1.z.object({
        instructorId: zod_1.z.string().min(1, "Instructor ID is required."),
    }),
});
exports.getInstructorStatsSchema = zod_1.z.object({
    params: zod_1.z.object({
        instructorId: zod_1.z.string().min(1, "Instructor ID is required."),
    }),
});
//# sourceMappingURL=enrollment.validation.js.map