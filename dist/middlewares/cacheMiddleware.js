"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheMiddleware = void 0;
const cacheKey_1 = require("../utils/cacheKey");
const course_service_1 = require("../modules/courses/course.service");
const cache_1 = require("../utils/cache");
const errorHandler_1 = require("../utils/errorHandler");
// A dedicated function to handle the cache refresh
const refreshCache = async (queryOptions, cacheKey) => {
    try {
        const freshData = await (0, course_service_1.getAllCoursesService)({ ...queryOptions });
        await (0, cache_1.setCache)(cacheKey, { ...freshData, cached: false });
    }
    catch (error) {
        console.error("Failed to refresh cache:", error);
    }
};
const cacheMiddleware = (baseKey, options = {}) => {
    return async (req, res, next) => {
        try {
            const params = {};
            if (options.param) {
                const value = req.params[options.param];
                if (value !== undefined && value !== null && value !== "") {
                    params[options.param] = value;
                }
            }
            if (options.isList) {
                for (const [key, value] of Object.entries(req.query)) {
                    if (value !== undefined && value !== null && value !== "") {
                        params[key] = Array.isArray(value) ? value.join(",") : String(value);
                    }
                }
            }
            const cacheKey = (0, cacheKey_1.generateCacheKey)(baseKey, params);
            console.log(`🔑 Cache middleware - Key: ${cacheKey}, BaseKey: ${baseKey}, Params:`, params);
            const cached = await (0, cache_1.getCacheWithTTL)(cacheKey);
            if (cached && cached.data) {
                console.log(`✅ Cache HIT for key: ${cacheKey}, TTL: ${cached.ttl}s`);
                if (cached.ttl > 0) {
                    // Return cached data in consistent format
                    const cachedResponse = cached.data;
                    // Check if data has discussions/pagination structure (needs reformatting)
                    if (cachedResponse.discussions && cachedResponse.pagination) {
                        return res.json({
                            success: true,
                            message: 'Retrieved from cache',
                            data: cachedResponse.discussions,
                            meta: {
                                ...cachedResponse.pagination,
                                cached: true
                            }
                        });
                    }
                    // Check if data has reviews/pagination structure (needs reformatting)
                    if (cachedResponse.data && cachedResponse.pagination) {
                        return res.json({
                            success: true,
                            message: 'Retrieved from cache',
                            data: cachedResponse.data,
                            meta: {
                                ...cachedResponse.pagination,
                                cached: true
                            }
                        });
                    }
                    // Check if cached data is a raw array (chapters, etc.)
                    if (Array.isArray(cachedResponse)) {
                        return res.json({
                            success: true,
                            message: 'Retrieved from cache',
                            data: cachedResponse,
                            meta: {
                                cached: true
                            }
                        });
                    }
                    // Otherwise return as-is with cached flag
                    return res.json({ ...cachedResponse, cached: true });
                }
                else {
                    // Send stale data immediately
                    const cachedResponse = cached.data;
                    // Check if cached data is a raw array (chapters, etc.)
                    if (Array.isArray(cachedResponse)) {
                        res.json({
                            success: true,
                            message: 'Retrieved from cache (stale)',
                            data: cachedResponse,
                            meta: {
                                cached: 'stale'
                            }
                        });
                    }
                    else if (cachedResponse.discussions && cachedResponse.pagination) {
                        // Check if data has discussions/pagination structure (needs reformatting)
                        res.json({
                            success: true,
                            message: 'Retrieved from cache (stale)',
                            data: cachedResponse.discussions,
                            meta: {
                                ...cachedResponse.pagination,
                                cached: 'stale'
                            }
                        });
                    }
                    else if (cachedResponse.data && cachedResponse.pagination) {
                        // Check if data has reviews/pagination structure (needs reformatting)
                        res.json({
                            success: true,
                            message: 'Retrieved from cache (stale)',
                            data: cachedResponse.data,
                            meta: {
                                ...cachedResponse.pagination,
                                cached: 'stale'
                            }
                        });
                    }
                    else {
                        res.json({ ...cachedResponse, cached: 'stale' });
                    }
                    // Asynchronously trigger a cache refresh without blocking the response
                    const queryOptions = {
                        page: parseInt(req.query.page || '1', 10),
                        limit: parseInt(req.query.limit || '9', 10),
                        search: req.query.search,
                        category: req.query.category,
                    };
                    refreshCache(queryOptions, cacheKey);
                    return;
                }
            }
            // Cache miss: Pass cache key to controller for setting
            console.log(`❌ Cache MISS for key: ${cacheKey}`);
            req.cacheKey = cacheKey;
            next();
        }
        catch (error) {
            console.error("Cache middleware error:", error);
            next((0, errorHandler_1.createError)('Cache middleware failed', 500));
        }
    };
};
exports.cacheMiddleware = cacheMiddleware;
//# sourceMappingURL=cacheMiddleware.js.map