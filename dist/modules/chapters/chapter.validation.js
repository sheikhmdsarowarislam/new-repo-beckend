"use strict";
// src/modules/chapters/chapter.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderChapterContentSchema = exports.reorderChaptersSchema = exports.getCourseChaptersSchema = exports.getChapterSchema = exports.updateChapterSchema = exports.createChapterSchema = void 0;
const zod_1 = require("zod");
// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = zod_1.z.string()
    .nonempty('ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');
// Create Chapter
exports.createChapterSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().nonempty("Title is required").min(3, "Title too short"),
        course: objectIdSchema.describe("Course ID is required"),
        order: zod_1.z.number().int("Order must be an integer").min(1, "Order must be >=1").optional(),
    }),
});
// Update Chapter
exports.updateChapterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema.describe("Chapter ID is required"),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, "Title too short").optional(),
        order: zod_1.z.number().int("Order must be an integer").min(1, "Order must be >=1").optional(),
    }),
});
// Get Chapter / Update Chapter / Delete Chapter (ID in params)
exports.getChapterSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema.describe("Chapter ID is required"), // Expects 'id'
    }),
});
exports.getCourseChaptersSchema = zod_1.z.object({
    params: zod_1.z.object({
        // Correctly matches the route parameter name
        courseId: objectIdSchema.describe("Course ID is required"),
    }),
});
// Reorder Chapters Only (Simplified)
exports.reorderChaptersSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: objectIdSchema.describe("Course ID is required"),
        order: zod_1.z.array(zod_1.z.object({
            chapterId: objectIdSchema.describe("Chapter ID is required"),
            order: zod_1.z.number().int("Order must be an integer").min(1, "Order must be >=1"),
        })).min(1, "At least one chapter must be reordered"),
    }),
});
// Reorder Chapter Content (Lectures & Quizzes)
exports.reorderChapterContentSchema = zod_1.z.object({
    params: zod_1.z.object({
        chapterId: objectIdSchema.describe("Chapter ID is required"),
    }),
    body: zod_1.z.object({
        items: zod_1.z.array(zod_1.z.object({
            itemId: objectIdSchema.describe("Item ID is required"),
            itemType: zod_1.z.enum(['lecture', 'quiz'], { message: "Item type must be 'lecture' or 'quiz'" }),
            order: zod_1.z.number().int("Order must be an integer").min(1, "Order must be >=1"),
        })).min(1, "At least one item must be provided"),
    }),
});
//# sourceMappingURL=chapter.validation.js.map