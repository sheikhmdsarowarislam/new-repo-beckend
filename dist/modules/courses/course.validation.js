"use strict";
// src/modules/courses/course.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructorCoursesSchema = exports.getCourseSchema = exports.updateCourseSchema = exports.createCourseSchema = exports.getAllCoursesSchema = void 0;
const zod_1 = require("zod");
// Zod validator for MongoDB ObjectId
const objectIdSchema = zod_1.z.string()
    .min(24, 'ID must be at least 24 characters long.')
    .max(24, 'ID must be exactly 24 characters long.')
    .regex(/^[0-9a-fA-F]{24}$/, 'ID must be a valid 24-character hex string.');
exports.getAllCoursesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        search: zod_1.z.string().optional(),
    }).optional(),
});
// Schema for creating a new course
exports.createCourseSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters long.'),
        description: zod_1.z.string().min(20, 'Description must be at least 20 characters long.'),
        category: zod_1.z.string().min(1, 'Category is required.'),
        price: zod_1.z.number().min(0, 'Price must be a non-negative number.'),
        discount: zod_1.z.number().min(0, 'Discount must be in between 0 and 100.').max(100, 'Discount must be in between 0 and 100.').optional(),
        thumbnail: zod_1.z.string().refine((val) => {
            // Accept URLs or base64 data URIs
            return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/');
        }, { message: 'Thumbnail must be a valid URL or base64 image data.' }).optional(),
        stacks: zod_1.z.array(zod_1.z.string()).optional(),
        level: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        requirements: zod_1.z.array(zod_1.z.string()).optional(),
        whatYouWillLearn: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
// Schema for updating a course
exports.updateCourseSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema,
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, 'Title must be at least 3 characters long.').optional(),
        description: zod_1.z.string().min(20, 'Description must be at least 20 characters long.').optional(),
        category: zod_1.z.string().min(1, 'Category is required.').optional(),
        price: zod_1.z.number().min(0, 'Price must be a non-negative number.').optional(),
        discount: zod_1.z.number().min(0, 'Discount must be in between 0 and 100.').max(100, 'Discount must be in between 0 and 100.').optional(),
        thumbnail: zod_1.z.string().refine((val) => {
            // Accept URLs or base64 data URIs
            return val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/');
        }, { message: 'Thumbnail must be a valid URL or base64 image data.' }).optional(),
        status: zod_1.z.enum(['draft', 'published', 'archived']).optional(),
        stacks: zod_1.z.array(zod_1.z.string()).optional(),
        level: zod_1.z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        requirements: zod_1.z.array(zod_1.z.string()).optional(),
        whatYouWillLearn: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
// Schema for retrieving a single course
exports.getCourseSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema,
    }),
});
// Schema for retrieving courses by instructor
exports.getInstructorCoursesSchema = zod_1.z.object({
    params: zod_1.z.object({
        instructorId: objectIdSchema,
    }),
});
//# sourceMappingURL=course.validation.js.map