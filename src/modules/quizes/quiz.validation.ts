// src/modules/quizes/quiz.validation.ts

import { z } from 'zod';

// Optimized Zod validator for MongoDB ObjectId format
const objectIdSchema = z.string()
  .min(1, 'ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

// Optimized schema for quiz question
const questionSchema = z.object({
  questionText: z.string().min(3, "Question text must be at least 3 characters"),
  options: z.array(z.string().min(1, "Option cannot be empty"))
    .min(2, "At least 2 options required")
    .max(6, "Maximum 6 options allowed"),
  correctAnswer: z.number().int().min(0, "Invalid answer index"),
  explanation: z.string().optional(),
});

// Optimized Create Quiz Schema
export const createQuizSchema = z.object({
  body: z.object({
    course: objectIdSchema,
    chapter: objectIdSchema,
    title: z.string().min(3, "Quiz title must be at least 3 characters"),
    questions: z.array(questionSchema)
      .min(1, "At least one question is required")
      .max(50, "Maximum 50 questions per quiz"),
    order: z.number().int().min(1, "Order must be >=1").optional(),
    duration: z.number().int().min(60, "Duration must be at least 60 seconds").optional(),
  }),
});

// Optimized Update Quiz Schema
export const updateQuizSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title too short").optional(),
    order: z.number().int().min(1, "Order must be >=1").optional(),
    questions: z.array(questionSchema).min(1).max(50).optional(),
    duration: z.number().int().min(60, "Duration must be at least 60 seconds").optional(),
  }),
});

// Optimized Quiz ID Schema
export const quizIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Optimized Submit Quiz Attempt Schema
export const submitQuizAttemptSchema = z.object({
  body: z.object({
    answers: z.array(z.number().int().min(0, "Invalid answer index"))
      .min(1, "At least one answer is required"),
  }),
});

// Optimized Quiz Results Schema
export const getQuizResultsSchema = z.object({
  params: z.object({
    courseId: objectIdSchema,
  }),
});

// Type exports
export type ICreateQuizBody = z.infer<typeof createQuizSchema>['body'];
export type IUpdateQuizBody = z.infer<typeof updateQuizSchema>['body'];
export type ISubmitQuizAttemptBody = z.infer<typeof submitQuizAttemptSchema>['body'];
