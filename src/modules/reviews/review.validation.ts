// src/modules/reviews/review.validation.ts

import { z } from 'zod';

// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = z.string()
  .nonempty('ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');

// Create Review Schema
export const createReviewSchema = z.object({
  body: z.object({
    course: objectIdSchema.describe("Course ID is required"),
    rating: z.number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5"),
    comment: z.string()
      .min(10, "Comment must be at least 10 characters")
      .max(1000, "Comment cannot exceed 1000 characters")
      .optional(),
  }),
});

// Update Review Schema
export const updateReviewSchema = z.object({
  body: z.object({
    rating: z.number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5")
      .optional(),
    comment: z.string()
      .min(10, "Comment must be at least 10 characters")
      .max(1000, "Comment cannot exceed 1000 characters")
      .optional(),
  }),
});

// Review ID Schema for params
export const reviewIdSchema = z.object({
  params: z.object({
    id: objectIdSchema.describe("Review ID is required"),
  }),
});

// Course ID Schema for getting course reviews
export const getCourseReviewsSchema = z.object({
  params: z.object({
    courseId: objectIdSchema.describe("Course ID is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.enum(['rating', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }).optional(),
});

// Get Course Review Stats Schema
export const getCourseReviewStatsSchema = z.object({
  params: z.object({
    courseId: objectIdSchema.describe("Course ID is required"),
  }),
});

// Get User Reviews Schema (uses authenticated user)
export const getUserReviewsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

export const getInstructorReviewsSchema = z.object({
  params: z.object({
    instructorId: objectIdSchema,
  }),
});

// Type exports
export type ICreateReviewBody = z.infer<typeof createReviewSchema>['body'];
export type IUpdateReviewBody = z.infer<typeof updateReviewSchema>['body'];
