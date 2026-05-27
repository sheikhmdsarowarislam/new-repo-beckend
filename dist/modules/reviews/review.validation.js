"use strict";
// src/modules/reviews/review.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructorReviewsSchema = exports.getUserReviewsSchema = exports.getCourseReviewStatsSchema = exports.getCourseReviewsSchema = exports.reviewIdSchema = exports.updateReviewSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = zod_1.z.string()
    .nonempty('ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');
// Create Review Schema
exports.createReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        course: objectIdSchema.describe("Course ID is required"),
        rating: zod_1.z.number()
            .int("Rating must be an integer")
            .min(1, "Rating must be at least 1")
            .max(5, "Rating cannot exceed 5"),
        comment: zod_1.z.string()
            .min(10, "Comment must be at least 10 characters")
            .max(1000, "Comment cannot exceed 1000 characters")
            .optional(),
    }),
});
// Update Review Schema
exports.updateReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number()
            .int("Rating must be an integer")
            .min(1, "Rating must be at least 1")
            .max(5, "Rating cannot exceed 5")
            .optional(),
        comment: zod_1.z.string()
            .min(10, "Comment must be at least 10 characters")
            .max(1000, "Comment cannot exceed 1000 characters")
            .optional(),
    }),
});
// Review ID Schema for params
exports.reviewIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema.describe("Review ID is required"),
    }),
});
// Course ID Schema for getting course reviews
exports.getCourseReviewsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: objectIdSchema.describe("Course ID is required"),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(['rating', 'createdAt']).optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }).optional(),
});
// Get Course Review Stats Schema
exports.getCourseReviewStatsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: objectIdSchema.describe("Course ID is required"),
    }),
});
// Get User Reviews Schema (uses authenticated user)
exports.getUserReviewsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }).optional(),
});
exports.getInstructorReviewsSchema = zod_1.z.object({
    params: zod_1.z.object({
        instructorId: objectIdSchema,
    }),
});
//# sourceMappingURL=review.validation.js.map