"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCacheKey = void 0;
// utils/cacheKey.ts
const generateCacheKey = (base, params = {}) => {
    const parts = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}=${String(v)}`);
    return parts.length ? `${base}:${parts.join(":")}` : base;
};
exports.generateCacheKey = generateCacheKey;
//# sourceMappingURL=cacheKey.js.map