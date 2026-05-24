// src/modules/discussions/discussion.validation.ts

import { z } from 'zod';

// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = z.string()
  .nonempty('ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');

// Create Discussion Schema
export const createDiscussionSchema = z.object({
  body: z.object({
    lecture: objectIdSchema.describe("Lecture ID is required"),
    question: z.string()
      .min(10, "Question must be at least 10 characters")
      .max(1000, "Question cannot exceed 1000 characters"),
  }),
});

// Answer Discussion Schema
export const answerDiscussionSchema = z.object({
  body: z.object({
    text: z.string()
      .min(5, "Answer must be at least 5 characters")
      .max(2000, "Answer cannot exceed 2000 characters"),
  }),
});

// Update Discussion Schema
export const updateDiscussionSchema = z.object({
  body: z.object({
    question: z.string()
      .min(10, "Question must be at least 10 characters")
      .max(1000, "Question cannot exceed 1000 characters"),
  }),
});

// Discussion ID Schema for params
export const discussionIdSchema = z.object({
  params: z.object({
    id: objectIdSchema.describe("Discussion ID is required"),
  }),
});

// Lecture ID Schema for getting lecture discussions
export const getLectureDiscussionsSchema = z.object({
  params: z.object({
    lectureId: objectIdSchema.describe("Lecture ID is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

// Course ID Schema for getting course discussions
export const getCourseDiscussionsSchema = z.object({
  params: z.object({
    courseId: objectIdSchema.describe("Course ID is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

// Get User Discussions Schema - simplified to handle no query params
export const getUserDiscussionsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).strict().optional(),
}).passthrough(); // Allow other fields to pass through

// Type exports
export type ICreateDiscussionBody = z.infer<typeof createDiscussionSchema>['body'];
export type IAnswerDiscussionBody = z.infer<typeof answerDiscussionSchema>['body'];
export type IUpdateDiscussionBody = z.infer<typeof updateDiscussionSchema>['body'];
