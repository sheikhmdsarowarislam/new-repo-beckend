import { z } from 'zod';
import { Types } from 'mongoose';

// Helper for Mongoose ObjectId validation
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId format',
});

// --- Base Payloads ---

export const CreateLectureBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  course: objectIdSchema,
  chapter: objectIdSchema,
  videoUrl: z.string().url('Must be a valid URL'),
  duration: z.number().int().positive('Duration must be a positive integer'),
  order: z.number().int().positive('Order must be a positive integer').optional(),
  isPreview: z.boolean().default(false).optional(),
  resources: z.string().optional(),
});
export type CreateLecturePayload = z.infer<typeof CreateLectureBodySchema>;


export const UpdateLectureBodySchema = CreateLectureBodySchema.partial().extend({
  chapter: objectIdSchema.optional(),
  order: z.number().int().positive().optional(),
});
export type UpdateLecturePayload = z.infer<typeof UpdateLectureBodySchema>;

// --- API Schema Definitions (Compatible with validate.middleware.ts) ---

// POST /api/lectures/
export const CreateLectureSchema = z.object({
  body: CreateLectureBodySchema,
});


// PATCH /api/lectures/:id
export const UpdateLectureSchema = z.object({
  params: z.object({
    id: objectIdSchema.describe('Lecture ID is required in URL path.'),
  }),
  body: UpdateLectureBodySchema,
});


// DELETE /api/lectures/:id & GET /api/lectures/:id
export const IdParamSchema = z.object({
  params: z.object({
    id: objectIdSchema.describe('Lecture ID is required in URL path.'),
  }),
});


// POST /api/lectures/reorder
export const ReorderItemSchema = z.object({
  lectureId: objectIdSchema,
  newOrder: z.number().int().positive('New order must be a positive integer'),
});
export type ReorderItem = z.infer<typeof ReorderItemSchema>;

export const ReorderLecturesSchema = z.object({
  body: z.object({
    chapterId: objectIdSchema,
    reorderData: z.array(ReorderItemSchema).min(1, 'Reorder array cannot be empty'),
  })
});
export type ReorderLecturesPayload = z.infer<typeof ReorderLecturesSchema>['body'];
