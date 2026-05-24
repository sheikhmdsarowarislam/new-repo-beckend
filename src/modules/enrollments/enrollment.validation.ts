import { z } from "zod";

export const submitPaymentSchema = z.object({
  body: z.object({
    courseId: z.string().min(1, "Course ID is required."),
    transactionId: z
      .string()
      .min(1, "Transaction ID or mobile number is required.")
      .max(100, "Transaction ID too long."),
    couponCode: z.string().optional(),
  }),
});

export const approveRejectSchema = z.object({
  params: z.object({
    enrollmentId: z.string().min(1, "Enrollment ID is required."),
  }),
  body: z
    .object({
      reason: z.string().max(500).optional(),
      validityDays: z.number().int().min(1).max(1825).optional(), // 1 day to 5 years
    })
    .optional(),
});

export const getUserEnrolledCoursesSchema = z.object({
  params: z.object({
    userId: z.string().min(1, "User ID is required."),
  }),
});

export const getEnrolledCourseDetailsSchema = z.object({
  params: z.object({
    courseId: z.string().min(1, "Course ID is required."),
  }),
});

export const getStudentsByInstructorSchema = z.object({
  params: z.object({
    instructorId: z.string().min(1, "Instructor ID is required."),
  }),
});

export const getInstructorStatsSchema = z.object({
  params: z.object({
    instructorId: z.string().min(1, "Instructor ID is required."),
  }),
});