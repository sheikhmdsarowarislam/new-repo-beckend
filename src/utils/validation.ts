// Common validation utilities

import { Request } from 'express';
import { z } from 'zod';
import { VALIDATION } from './constants';

/**
 * Common validation schemas
 */
export const commonSchemas = {
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  name: z.string()
    .min(VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.NAME_MAX_LENGTH, `Name must not exceed ${VALIDATION.NAME_MAX_LENGTH} characters`)
    .trim(),

  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  title: z.string()
    .min(1, 'Title is required')
    .max(VALIDATION.TITLE_MAX_LENGTH, `Title must not exceed ${VALIDATION.TITLE_MAX_LENGTH} characters`)
    .trim(),

  description: z.string()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH, `Description must not exceed ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`)
    .optional()
    .transform(val => val?.trim() || ''),

  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),

  url: z.string()
    .url('Invalid URL format')
    .optional(),

  positiveNumber: z.coerce.number()
    .positive('Must be a positive number'),

  nonNegativeNumber: z.coerce.number()
    .min(0, 'Must be a non-negative number'),

  rating: z.coerce.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),

  status: z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled']),
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (data: any): any => {
  if (typeof data === 'string') {
    return data.trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Extract and validate query parameters
 */
export const extractQueryParams = (req: Request) => {
  const { page, limit, search, sort, order, ...filters } = req.query;
  
  return {
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 10,
    search: search as string,
    sort: sort as string,
    order: (order as 'asc' | 'desc') || 'desc',
    filters: Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    )
  };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (file: any, allowedTypes: string[], maxSize: number) => {
  if (!file) {
    throw new Error('No file uploaded');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  if (file.size > maxSize) {
    throw new Error(`File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
  }

  return true;
};

/**
 * Create a validation schema for common CRUD operations
 */
export const createCrudSchema = (baseSchema: z.ZodObject<any>) => {
  return {
    create: baseSchema,
    update: baseSchema.partial(),
    get: z.object({
      id: commonSchemas.objectId,
    }),
    list: z.object({
      ...commonSchemas.pagination.shape,
      ...Object.keys(baseSchema.shape).reduce((acc, key) => {
        acc[key] = baseSchema.shape[key].optional();
        return acc;
      }, {} as any),
    }),
  };
};

/**
 * Validate and transform request data
 */
export const validateAndTransform = <T>(
  schema: z.ZodSchema<T>,
  data: any
): T => {
  const sanitized = sanitizeInput(data);
  return schema.parse(sanitized);
};
