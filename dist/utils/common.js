"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = exports.capitalize = exports.isEmpty = exports.throttle = exports.debounce = exports.retry = exports.sleep = exports.generateCacheKey = exports.omit = exports.pick = exports.removeUndefined = exports.deepClone = exports.isValidDate = exports.formatDate = exports.calculatePagination = exports.getFilters = exports.getPaginationParams = exports.getUserRole = exports.getUserId = exports.toObjectIds = exports.toObjectId = exports.isValidObjectId = exports.generateRandomHex = exports.generateRandomNumeric = exports.generateRandomString = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("./constants");
const generateRandomString = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomString = generateRandomString;
/**
 * Generate a random numeric string
 */
const generateRandomNumeric = (length = 6) => {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomNumeric = generateRandomNumeric;
/**
 * Generate a random hex string
 */
const generateRandomHex = (length = 6) => {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
exports.generateRandomHex = generateRandomHex;
/**
 * Check if a string is a valid ObjectId
 */
const isValidObjectId = (id) => {
    return mongoose_1.Types.ObjectId.isValid(id);
};
exports.isValidObjectId = isValidObjectId;
/**
 * Convert string to ObjectId
 */
const toObjectId = (id) => {
    return new mongoose_1.Types.ObjectId(id);
};
exports.toObjectId = toObjectId;
/**
 * Convert array of strings to ObjectIds
 */
const toObjectIds = (ids) => {
    return ids.map(id => new mongoose_1.Types.ObjectId(id));
};
exports.toObjectIds = toObjectIds;
/**
 * Extract user ID from authenticated request
 */
const getUserId = (req) => {
    if (!req.user || !req.user._id) {
        throw new Error('User not authenticated or ID missing from token');
    }
    return req.user._id.toString();
};
exports.getUserId = getUserId;
/**
 * Extract user role from authenticated request
 */
const getUserRole = (req) => {
    if (!req.user || !req.user.role) {
        throw new Error('User not authenticated or role missing from token');
    }
    return req.user.role;
};
exports.getUserRole = getUserRole;
/**
 * Extract pagination parameters from request
 */
const getPaginationParams = (req) => {
    const page = parseInt(req.query.page || constants_1.PAGINATION.DEFAULT_PAGE.toString(), 10);
    const limit = Math.min(parseInt(req.query.limit || constants_1.PAGINATION.DEFAULT_LIMIT.toString(), 10), constants_1.PAGINATION.MAX_LIMIT);
    const search = req.query.search;
    const sort = req.query.sort;
    const order = req.query.order || 'desc';
    const category = req.query.category;
    const level = req.query.level;
    return { page, limit, search, sort, order, category, level };
};
exports.getPaginationParams = getPaginationParams;
/**
 * Extract filters from request query
 */
const getFilters = (req, allowedFilters = []) => {
    const filters = {};
    Object.entries(req.query).forEach(([key, value]) => {
        if (allowedFilters.includes(key) && value !== undefined && value !== null && value !== '') {
            filters[key] = value;
        }
    });
    return filters;
};
exports.getFilters = getFilters;
/**
 * Calculate pagination metadata
 */
const calculatePagination = (page, limit, total) => {
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
exports.calculatePagination = calculatePagination;
/**
 * Format date to ISO string
 */
const formatDate = (date) => {
    return new Date(date).toISOString();
};
exports.formatDate = formatDate;
/**
 * Check if date is valid
 */
const isValidDate = (date) => {
    return date instanceof Date && !isNaN(date.getTime());
};
exports.isValidDate = isValidDate;
/**
 * Deep clone an object
 */
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};
exports.deepClone = deepClone;
/**
 * Remove undefined values from object
 */
const removeUndefined = (obj) => {
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
        if (value !== undefined) {
            result[key] = value;
        }
    });
    return result;
};
exports.removeUndefined = removeUndefined;
/**
 * Pick specific properties from object
 */
const pick = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};
exports.pick = pick;
/**
 * Omit specific properties from object
 */
const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};
exports.omit = omit;
/**
 * Generate cache key from parameters
 */
const generateCacheKey = (prefix, params = {}) => {
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((result, key) => {
        result[key] = params[key];
        return result;
    }, {});
    const paramString = JSON.stringify(sortedParams);
    return `${prefix}:${Buffer.from(paramString).toString('base64')}`;
};
exports.generateCacheKey = generateCacheKey;
/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.sleep = sleep;
/**
 * Retry function with exponential backoff
 */
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt === maxAttempts) {
                throw lastError;
            }
            await (0, exports.sleep)(delay * Math.pow(2, attempt - 1));
        }
    }
    throw lastError;
};
exports.retry = retry;
/**
 * Debounce function
 */
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
exports.debounce = debounce;
/**
 * Throttle function
 */
const throttle = (func, limit) => {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};
exports.throttle = throttle;
/**
 * Check if value is empty
 */
const isEmpty = (value) => {
    if (value == null)
        return true;
    if (typeof value === 'string')
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
};
exports.isEmpty = isEmpty;
/**
 * Capitalize first letter of string
 */
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
/**
 * Convert string to slug
 */
const slugify = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};
exports.slugify = slugify;
//# sourceMappingURL=common.js.map