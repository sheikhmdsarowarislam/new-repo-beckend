"use strict";
// Common validation utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAndTransform = exports.createCrudSchema = exports.validateFileUpload = exports.extractQueryParams = exports.sanitizeInput = exports.commonSchemas = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
/**
 * Common validation schemas
 */
exports.commonSchemas = {
    objectId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
    pagination: zod_1.z.object({
        page: zod_1.z.coerce.number().min(1).default(1),
        limit: zod_1.z.coerce.number().min(1).max(100).default(10),
        search: zod_1.z.string().optional(),
        sort: zod_1.z.string().optional(),
        order: zod_1.z.enum(['asc', 'desc']).default('desc'),
    }),
    name: zod_1.z.string()
        .min(constants_1.VALIDATION.NAME_MIN_LENGTH, `Name must be at least ${constants_1.VALIDATION.NAME_MIN_LENGTH} characters`)
        .max(constants_1.VALIDATION.NAME_MAX_LENGTH, `Name must not exceed ${constants_1.VALIDATION.NAME_MAX_LENGTH} characters`)
        .trim(),
    email: zod_1.z.string()
        .email('Invalid email format')
        .toLowerCase()
        .trim(),
    password: zod_1.z.string()
        .min(constants_1.VALIDATION.PASSWORD_MIN_LENGTH, `Password must be at least ${constants_1.VALIDATION.PASSWORD_MIN_LENGTH} characters`)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    title: zod_1.z.string()
        .min(1, 'Title is required')
        .max(constants_1.VALIDATION.TITLE_MAX_LENGTH, `Title must not exceed ${constants_1.VALIDATION.TITLE_MAX_LENGTH} characters`)
        .trim(),
    description: zod_1.z.string()
        .max(constants_1.VALIDATION.DESCRIPTION_MAX_LENGTH, `Description must not exceed ${constants_1.VALIDATION.DESCRIPTION_MAX_LENGTH} characters`)
        .optional()
        .transform(val => val?.trim() || ''),
    phone: zod_1.z.string()
        .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
        .optional(),
    url: zod_1.z.string()
        .url('Invalid URL format')
        .optional(),
    positiveNumber: zod_1.z.coerce.number()
        .positive('Must be a positive number'),
    nonNegativeNumber: zod_1.z.coerce.number()
        .min(0, 'Must be a non-negative number'),
    rating: zod_1.z.coerce.number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must not exceed 5'),
    status: zod_1.z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled']),
};
/**
 * Sanitize input data
 */
const sanitizeInput = (data) => {
    if (typeof data === 'string') {
        return data.trim();
    }
    if (Array.isArray(data)) {
        return data.map(exports.sanitizeInput);
    }
    if (data && typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = (0, exports.sanitizeInput)(value);
        }
        return sanitized;
    }
    return data;
};
exports.sanitizeInput = sanitizeInput;
/**
 * Extract and validate query parameters
 */
const extractQueryParams = (req) => {
    const { page, limit, search, sort, order, ...filters } = req.query;
    return {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 10,
        search: search,
        sort: sort,
        order: order || 'desc',
        filters: Object.fromEntries(Object.entries(filters).filter(([_, value]) => value !== undefined && value !== null && value !== ''))
    };
};
exports.extractQueryParams = extractQueryParams;
/**
 * Validate file upload
 */
const validateFileUpload = (file, allowedTypes, maxSize) => {
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
exports.validateFileUpload = validateFileUpload;
/**
 * Create a validation schema for common CRUD operations
 */
const createCrudSchema = (baseSchema) => {
    return {
        create: baseSchema,
        update: baseSchema.partial(),
        get: zod_1.z.object({
            id: exports.commonSchemas.objectId,
        }),
        list: zod_1.z.object({
            ...exports.commonSchemas.pagination.shape,
            ...Object.keys(baseSchema.shape).reduce((acc, key) => {
                acc[key] = baseSchema.shape[key].optional();
                return acc;
            }, {}),
        }),
    };
};
exports.createCrudSchema = createCrudSchema;
/**
 * Validate and transform request data
 */
const validateAndTransform = (schema, data) => {
    const sanitized = (0, exports.sanitizeInput)(data);
    return schema.parse(sanitized);
};
exports.validateAndTransform = validateAndTransform;
//# sourceMappingURL=validation.js.map