"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_CACHE_TTL = exports.DEFAULT_TTL = exports.CACHE_PREFIX = void 0;
exports.CACHE_PREFIX = process.env.NODE_ENV === "production" ? "lms:prod:" : "lms:dev:";
exports.DEFAULT_TTL = 15 * 60; // 15 minutes (matches JWT access token expiration)
exports.USER_CACHE_TTL = 15 * 24 * 60 * 60; // 15 days
//# sourceMappingURL=cacheConfig.js.map