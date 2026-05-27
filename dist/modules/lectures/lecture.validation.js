"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReorderLecturesSchema = exports.ReorderItemSchema = exports.IdParamSchema = exports.UpdateLectureSchema = exports.CreateLectureSchema = exports.UpdateLectureBodySchema = exports.CreateLectureBodySchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
// Helper for Mongoose ObjectId validation
const objectIdSchema = zod_1.z.string().refine((val) => mongoose_1.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
});
// --- Base Payloads ---
exports.CreateLectureBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title is required'),
    course: objectIdSchema,
    chapter: objectIdSchema,
    videoUrl: zod_1.z.string().url('Must be a valid URL'),
    duration: zod_1.z.number().int().positive('Duration must be a positive integer'),
    order: zod_1.z.number().int().positive('Order must be a positive integer').optional(),
    isPreview: zod_1.z.boolean().default(false).optional(),
    resources: zod_1.z.string().optional(),
});
exports.UpdateLectureBodySchema = exports.CreateLectureBodySchema.partial().extend({
    chapter: objectIdSchema.optional(),
    order: zod_1.z.number().int().positive().optional(),
});
// --- API Schema Definitions (Compatible with validate.middleware.ts) ---
// POST /api/lectures/
exports.CreateLectureSchema = zod_1.z.object({
    body: exports.CreateLectureBodySchema,
});
// PATCH /api/lectures/:id
exports.UpdateLectureSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema.describe('Lecture ID is required in URL path.'),
    }),
    body: exports.UpdateLectureBodySchema,
});
// DELETE /api/lectures/:id & GET /api/lectures/:id
exports.IdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema.describe('Lecture ID is required in URL path.'),
    }),
});
// POST /api/lectures/reorder
exports.ReorderItemSchema = zod_1.z.object({
    lectureId: objectIdSchema,
    newOrder: zod_1.z.number().int().positive('New order must be a positive integer'),
});
exports.ReorderLecturesSchema = zod_1.z.object({
    body: zod_1.z.object({
        chapterId: objectIdSchema,
        reorderData: zod_1.z.array(exports.ReorderItemSchema).min(1, 'Reorder array cannot be empty'),
    })
});
//# sourceMappingURL=lecture.validation.js.map