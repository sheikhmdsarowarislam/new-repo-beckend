import { Request } from 'express';
import { z } from 'zod';
/**
 * Common validation schemas
 */
export declare const commonSchemas: {
    objectId: z.ZodString;
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
        search: z.ZodOptional<z.ZodString>;
        sort: z.ZodOptional<z.ZodString>;
        order: z.ZodDefault<z.ZodEnum<{
            asc: "asc";
            desc: "desc";
        }>>;
    }, z.core.$strip>;
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    title: z.ZodString;
    description: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<string, string | undefined>>;
    phone: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    positiveNumber: z.ZodCoercedNumber<unknown>;
    nonNegativeNumber: z.ZodCoercedNumber<unknown>;
    rating: z.ZodCoercedNumber<unknown>;
    status: z.ZodEnum<{
        pending: "pending";
        active: "active";
        completed: "completed";
        cancelled: "cancelled";
        inactive: "inactive";
    }>;
};
/**
 * Sanitize input data
 */
export declare const sanitizeInput: (data: any) => any;
/**
 * Extract and validate query parameters
 */
export declare const extractQueryParams: (req: Request) => {
    page: number;
    limit: number;
    search: string;
    sort: string;
    order: "asc" | "desc";
    filters: {
        [k: string]: string | import("qs").ParsedQs | (string | import("qs").ParsedQs)[] | undefined;
    };
};
/**
 * Validate file upload
 */
export declare const validateFileUpload: (file: any, allowedTypes: string[], maxSize: number) => boolean;
/**
 * Create a validation schema for common CRUD operations
 */
export declare const createCrudSchema: (baseSchema: z.ZodObject<any>) => {
    create: z.ZodObject<any, z.core.$strip>;
    update: z.ZodObject<{
        [x: string]: z.ZodOptional<any>;
    }, z.core.$strip>;
    get: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    list: z.ZodObject<{
        [x: string]: any;
    }, z.core.$strip>;
};
/**
 * Validate and transform request data
 */
export declare const validateAndTransform: <T>(schema: z.ZodSchema<T>, data: any) => T;
//# sourceMappingURL=validation.d.ts.map