// src/modules/chapters/chapter.validation.ts

import { z } from 'zod';

// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = z.string()
  .nonempty('ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');

// Create Chapter
export const createChapterSchema = z.object({
  body: z.object({
    title: z.string().nonempty("Title is required").min(3, "Title too short"),
    course: objectIdSchema.describe("Course ID is required"),
    order: z.number().int("Order must be an integer").min(1, "Order must be >=1").optional(),
  }),
});


// Update Chapter
export const updateChapterSchema = z.object({
  params: z.object({
    id: objectIdSchema.describe("Chapter ID is required"),
  }),
  body: z.object({
    title: z.string().min(3, "Title too short").optional(),
    order: z.number().int("Order must be an integer").min(1, "Order must be >=1").optional(),
  }),
});

// Get Chapter / Update Chapter / Delete Chapter (ID in params)
export const getChapterSchema = z.object({
  params: z.object({
    id: objectIdSchema.describe("Chapter ID is required"), // Expects 'id'
  }),
});

export const getCourseChaptersSchema = z.object({
  params: z.object({
    // Correctly matches the route parameter name
    courseId: objectIdSchema.describe("Course ID is required"),
  }),
});

// Reorder Chapters Only (Simplified)
export const reorderChaptersSchema = z.object({
  body: z.object({
    courseId: objectIdSchema.describe("Course ID is required"),
    order: z.array(
      z.object({
        chapterId: objectIdSchema.describe("Chapter ID is required"),
        order: z.number().int("Order must be an integer").min(1, "Order must be >=1"),
      })
    ).min(1, "At least one chapter must be reordered"),
  }),
});

// Reorder Chapter Content (Lectures & Quizzes)
export const reorderChapterContentSchema = z.object({
  params: z.object({
    chapterId: objectIdSchema.describe("Chapter ID is required"),
  }),
  body: z.object({
    items: z.array(
      z.object({
        itemId: objectIdSchema.describe("Item ID is required"),
        itemType: z.enum(['lecture', 'quiz'], { message: "Item type must be 'lecture' or 'quiz'" }),
        order: z.number().int("Order must be an integer").min(1, "Order must be >=1"),
      })
    ).min(1, "At least one item must be provided"),
  }),
});


