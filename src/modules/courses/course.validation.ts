// src/modules/courses/course.validation.ts

import { z } from 'zod';

// Zod validator for MongoDB ObjectId
const objectIdSchema = z.string()
  .min(24, 'ID must be at least 24 characters long.')
  .max(24, 'ID must be exactly 24 characters long.')
  .regex(/^[0-9a-fA-F]{24}$/, 'ID must be a valid 24-character hex string.');

export const getAllCoursesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
  }).optional(),
});

// Schema for creating a new course
export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long.'),
    description: z.string().min(20, 'Description must be at least 20 characters long.'),
    category: z.string().min(1, 'Category is required.'),
    price: z.number().min(0, 'Price must be a non-negative number.'),
    discount: z.number().min(0, 'Discount must be in between 0 and 100.').max(100, 'Discount must be in between 0 and 100.').optional(),
    thumbnail: z.string().refine((val) => {
      // Accept URLs or base64 data URIs
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/');
    }, { message: 'Thumbnail must be a valid URL or base64 image data.' }).optional(),
    stacks: z.array(z.string()).optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    requirements: z.array(z.string()).optional(),
    whatYouWillLearn: z.array(z.string()).optional(),
  }),
});

// Schema for updating a course
export const updateCourseSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long.').optional(),
    description: z.string().min(20, 'Description must be at least 20 characters long.').optional(),
    category: z.string().min(1, 'Category is required.').optional(),
    price: z.number().min(0, 'Price must be a non-negative number.').optional(),
    discount: z.number().min(0, 'Discount must be in between 0 and 100.').max(100, 'Discount must be in between 0 and 100.').optional(),
    thumbnail: z.string().refine((val) => {
      // Accept URLs or base64 data URIs
      return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/');
    }, { message: 'Thumbnail must be a valid URL or base64 image data.' }).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    stacks: z.array(z.string()).optional(),
    level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    requirements: z.array(z.string()).optional(),
    whatYouWillLearn: z.array(z.string()).optional(),
  }),
});


// Schema for retrieving a single course
export const getCourseSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Schema for retrieving courses by instructor
export const getInstructorCoursesSchema = z.object({
  params: z.object({
    instructorId: objectIdSchema,
  }),
});