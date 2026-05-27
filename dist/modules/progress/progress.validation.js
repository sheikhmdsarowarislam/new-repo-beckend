"use strict";
// src/modules/progress/progress.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseCompletionStatsSchema = exports.getCourseProgressSchema = exports.updateLectureProgressSchema = void 0;
const zod_1 = require("zod");
// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = zod_1.z.string()
    .nonempty('ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');
// Update Lecture Progress Schema
exports.updateLectureProgressSchema = zod_1.z.object({
    params: zod_1.z.object({
        lectureId: objectIdSchema.describe("Lecture ID is required"),
    }),
    body: zod_1.z.object({
        progressPercentage: zod_1.z.number()
            .min(0, "Progress must be at least 0%")
            .max(1, "Progress cannot exceed 100%"),
    }),
});
// Get Course Progress Schema
exports.getCourseProgressSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: objectIdSchema.describe("Course ID is required"),
    }),
});
// Get Course Completion Stats Schema
exports.getCourseCompletionStatsSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: objectIdSchema.describe("Course ID is required"),
    }),
});
//# sourceMappingURL=progress.validation.js.map