import { Types } from 'mongoose';
import { Request } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PAGINATION } from './constants';

export const generateRandomString = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a random numeric string
 */
export const generateRandomNumeric = (length: number = 6): string => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a random hex string
 */
export const generateRandomHex = (length: number = 6): string => {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Check if a string is a valid ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

/**
 * Convert string to ObjectId
 */
export const toObjectId = (id: string | Types.ObjectId): Types.ObjectId => {
  return new Types.ObjectId(id);
};

/**
 * Convert array of strings to ObjectIds
 */
export const toObjectIds = (ids: (string | Types.ObjectId)[]): Types.ObjectId[] => {
  return ids.map(id => new Types.ObjectId(id));
};

/**
 * Extract user ID from authenticated request
 */
export const getUserId = (req: AuthRequest): string => {
  if (!req.user || !req.user._id) {
    throw new Error('User not authenticated or ID missing from token');
  }
  return req.user._id.toString();
};

/**
 * Extract user role from authenticated request
 */
export const getUserRole = (req: AuthRequest): string => {
  if (!req.user || !req.user.role) {
    throw new Error('User not authenticated or role missing from token');
  }
  return req.user.role;
};

/**
 * Extract pagination parameters from request
 */
export const getPaginationParams = (req: Request) => {
  const page = parseInt(req.query.page as string || PAGINATION.DEFAULT_PAGE.toString(), 10);
  const limit = Math.min(
    parseInt(req.query.limit as string || PAGINATION.DEFAULT_LIMIT.toString(), 10),
    PAGINATION.MAX_LIMIT
  );
  const search = req.query.search as string;
  const sort = req.query.sort as string;
  const order = (req.query.order as 'asc' | 'desc') || 'desc';
  const category = req.query.category as string;
  const level = req.query.level as string;

  return { page, limit, search, sort, order, category, level };
};

/**
 * Extract filters from request query
 */
export const getFilters = (req: Request, allowedFilters: string[] = []) => {
  const filters: Record<string, any> = {};
  
  Object.entries(req.query).forEach(([key, value]) => {
    if (allowedFilters.includes(key) && value !== undefined && value !== null && value !== '') {
      filters[key] = value;
    }
  });

  return filters;
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    skip,
    hasNextPage,
    hasPrevPage
  };
};

/**
 * Format date to ISO string
 */
export const formatDate = (date: Date | string): string => {
  return new Date(date).toISOString();
};

/**
 * Check if date is valid
 */
export const isValidDate = (date: any): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Deep clone an object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Remove undefined values from object
 */
export const removeUndefined = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const result: Partial<T> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key as keyof T] = value;
    }
  });

  return result;
};

/**
 * Pick specific properties from object
 */
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });

  return result;
};

/**
 * Omit specific properties from object
 */
export const omit = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  
  keys.forEach(key => {
    delete result[key];
  });

  return result;
};

/**
 * Generate cache key from parameters
 */
export const generateCacheKey = (prefix: string, params: Record<string, any> = {}): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);

  const paramString = JSON.stringify(sortedParams);
  return `${prefix}:${Buffer.from(paramString).toString('base64')}`;
};

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }

  throw lastError!;
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to slug
 */
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
