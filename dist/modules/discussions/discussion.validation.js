"use strict";
// src/modules/discussions/discussion.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDiscussionsSchema = exports.getCourseDiscussionsSchema = exports.getLectureDiscussionsSchema = exports.discussionIdSchema = exports.updateDiscussionSchema = exports.answerDiscussionSchema = exports.createDiscussionSchema = void 0;
const zod_1 = require("zod");
// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = zod_1.z.string()
    .nonempty('ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');
// Create Discussion Schema
exports.createDiscussionSchema = zod_1.z.object({
    body: zod_1.z.object({
        lecture: objectIdSchema.describe("Lecture ID is required"),
        question: zod_1.z.string()
            .min(10, "Question must be at least 10 characters")
            .max(1000, "Question cannot exceed 1000 characters"),
    }),
});
// Answer Discussion Schema
exports.answerDiscussionSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z.string()
            .min(5, "Answer must be at least 5 characters")
            .max(2000, "Answer cannot exceed 2000 characters"),
    }),
});
// Update Discussion Schema
exports.updateDiscussionSchema = zod_1.z.object({
    body: zod_1.z.object({
        question: zod_1.z.string()
            .min(10, "Question must be at least 10 characters")
            .max(1000, "Question cannot exceed 1000 characters"),
    }),
});
// Discussion ID Schema for params
exports.discussionIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema.describe("Discussion ID is required"),
    }),
});
// Lecture ID Schema for getting lecture discussions
exports.getLectureDiscussionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        lectureId: objectIdSchema.describe("Lecture ID is required"),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }).optional(),
});
// Course ID Schema for getting course discussions
exports.getCourseDiscussionsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: objectIdSchema.describe("Course ID is required"),
    }),
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }).optional(),
});
// Get User Discussions Schema - simplified to handle no query params
exports.getUserDiscussionsSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }).strict().optional(),
}).passthrough(); // Allow other fields to pass through
//# sourceMappingURL=discussion.validation.js.map