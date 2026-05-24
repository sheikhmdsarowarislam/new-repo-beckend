import { Request, Response, NextFunction } from "express";
import { generateCacheKey } from "../utils/cacheKey";
import { getAllCoursesService } from "../modules/courses/course.service";
import { getCacheWithTTL, setCache } from "../utils/cache";
import { createError } from "../utils/errorHandler";

export interface CacheMiddlewareOptions {
  param?: string;
  isList?: boolean;
}

// A dedicated function to handle the cache refresh
const refreshCache = async (queryOptions: any, cacheKey: string) => {
    try {
        const freshData = await getAllCoursesService({ ...queryOptions });
        await setCache(cacheKey, { ...freshData, cached: false });
    } catch (error) {
        console.error("Failed to refresh cache:", error);
    }
};

export const cacheMiddleware = (baseKey: string, options: CacheMiddlewareOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params: Record<string, string | number> = {};

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

      const cacheKey = generateCacheKey(baseKey, params);
      console.log(`🔑 Cache middleware - Key: ${cacheKey}, BaseKey: ${baseKey}, Params:`, params);
      
      const cached = await getCacheWithTTL(cacheKey);

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
        } else {
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
          } else if (cachedResponse.discussions && cachedResponse.pagination) {
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
          } else if (cachedResponse.data && cachedResponse.pagination) {
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
          } else {
            res.json({ ...cachedResponse, cached: 'stale' });
          }

          // Asynchronously trigger a cache refresh without blocking the response
          const queryOptions = {
            page: parseInt(req.query.page as string || '1', 10),
            limit: parseInt(req.query.limit as string || '9', 10),
            search: req.query.search as string,
            category: req.query.category as string,
          };
          refreshCache(queryOptions, cacheKey);
          return;
        }
      }

      // Cache miss: Pass cache key to controller for setting
      console.log(`❌ Cache MISS for key: ${cacheKey}`);
      (req as any).cacheKey = cacheKey;
      next();

    } catch (error) {
      console.error("Cache middleware error:", error);
      next(createError('Cache middleware failed', 500));
    }
  };
};