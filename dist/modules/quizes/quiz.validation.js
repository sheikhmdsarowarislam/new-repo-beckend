"use strict";
// src/modules/quizes/quiz.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizResultsSchema = exports.submitQuizAttemptSchema = exports.quizIdSchema = exports.updateQuizSchema = exports.createQuizSchema = void 0;
const zod_1 = require("zod");
// Optimized Zod validator for MongoDB ObjectId format
const objectIdSchema = zod_1.z.string()
    .min(1, 'ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');
// Optimized schema for quiz question
const questionSchema = zod_1.z.object({
    questionText: zod_1.z.string().min(3, "Question text must be at least 3 characters"),
    options: zod_1.z.array(zod_1.z.string().min(1, "Option cannot be empty"))
        .min(2, "At least 2 options required")
        .max(6, "Maximum 6 options allowed"),
    correctAnswer: zod_1.z.number().int().min(0, "Invalid answer index"),
    explanation: zod_1.z.string().optional(),
});
// Optimized Create Quiz Schema
exports.createQuizSchema = zod_1.z.object({
    body: zod_1.z.object({
        course: objectIdSchema,
        chapter: objectIdSchema,
        title: zod_1.z.string().min(3, "Quiz title must be at least 3 characters"),
        questions: zod_1.z.array(questionSchema)
            .min(1, "At least one question is required")
            .max(50, "Maximum 50 questions per quiz"),
        order: zod_1.z.number().int().min(1, "Order must be >=1").optional(),
        duration: zod_1.z.number().int().min(60, "Duration must be at least 60 seconds").optional(),
    }),
});
// Optimized Update Quiz Schema
exports.updateQuizSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, "Title too short").optional(),
        order: zod_1.z.number().int().min(1, "Order must be >=1").optional(),
        questions: zod_1.z.array(questionSchema).min(1).max(50).optional(),
        duration: zod_1.z.number().int().min(60, "Duration must be at least 60 seconds").optional(),
    }),
});
// Optimized Quiz ID Schema
exports.quizIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema,
    }),
});
// Optimized Submit Quiz Attempt Schema
exports.submitQuizAttemptSchema = zod_1.z.object({
    body: zod_1.z.object({
        answers: zod_1.z.array(zod_1.z.number().int().min(0, "Invalid answer index"))
            .min(1, "At least one answer is required"),
    }),
});
// Optimized Quiz Results Schema
exports.getQuizResultsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: objectIdSchema,
    }),
});
//# sourceMappingURL=quiz.validation.js.map