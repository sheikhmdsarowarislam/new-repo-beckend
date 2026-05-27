import { Types } from 'mongoose';
import { Request } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const generateRandomString: (length?: number) => string;
/**
 * Generate a random numeric string
 */
export declare const generateRandomNumeric: (length?: number) => string;
/**
 * Generate a random hex string
 */
export declare const generateRandomHex: (length?: number) => string;
/**
 * Check if a string is a valid ObjectId
 */
export declare const isValidObjectId: (id: string) => boolean;
/**
 * Convert string to ObjectId
 */
export declare const toObjectId: (id: string | Types.ObjectId) => Types.ObjectId;
/**
 * Convert array of strings to ObjectIds
 */
export declare const toObjectIds: (ids: (string | Types.ObjectId)[]) => Types.ObjectId[];
/**
 * Extract user ID from authenticated request
 */
export declare const getUserId: (req: AuthRequest) => string;
/**
 * Extract user role from authenticated request
 */
export declare const getUserRole: (req: AuthRequest) => string;
/**
 * Extract pagination parameters from request
 */
export declare const getPaginationParams: (req: Request) => {
    page: number;
    limit: number;
    search: string;
    sort: string;
    order: "asc" | "desc";
    category: string;
    level: string;
};
/**
 * Extract filters from request query
 */
export declare const getFilters: (req: Request, allowedFilters?: string[]) => Record<string, any>;
/**
 * Calculate pagination metadata
 */
export declare const calculatePagination: (page: number, limit: number, total: number) => {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    skip: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};
/**
 * Format date to ISO string
 */
export declare const formatDate: (date: Date | string) => string;
/**
 * Check if date is valid
 */
export declare const isValidDate: (date: any) => boolean;
/**
 * Deep clone an object
 */
export declare const deepClone: <T>(obj: T) => T;
/**
 * Remove undefined values from object
 */
export declare const removeUndefined: <T extends Record<string, any>>(obj: T) => Partial<T>;
/**
 * Pick specific properties from object
 */
export declare const pick: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]) => Pick<T, K>;
/**
 * Omit specific properties from object
 */
export declare const omit: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]) => Omit<T, K>;
/**
 * Generate cache key from parameters
 */
export declare const generateCacheKey: (prefix: string, params?: Record<string, any>) => string;
/**
 * Sleep for specified milliseconds
 */
export declare const sleep: (ms: number) => Promise<void>;
/**
 * Retry function with exponential backoff
 */
export declare const retry: <T>(fn: () => Promise<T>, maxAttempts?: number, delay?: number) => Promise<T>;
/**
 * Debounce function
 */
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
/**
 * Throttle function
 */
export declare const throttle: <T extends (...args: any[]) => any>(func: T, limit: number) => ((...args: Parameters<T>) => void);
/**
 * Check if value is empty
 */
export declare const isEmpty: (value: any) => boolean;
/**
 * Capitalize first letter of string
 */
export declare const capitalize: (str: string) => string;
/**
 * Convert string to slug
 */
export declare const slugify: (str: string) => string;
//# sourceMappingURL=common.d.ts.map