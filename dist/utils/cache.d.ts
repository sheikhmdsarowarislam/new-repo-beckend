export declare const namespacedKey: (key: string) => string;
export declare function setCache(key: string, value: any, ttlSeconds?: number): Promise<void>;
export declare function getCacheWithTTL<T = any>(key: string): Promise<{
    data: T | null;
    ttl: number;
} | null>;
export declare function getCache<T = any>(key: string): Promise<T | null>;
export declare function invalidateCache(pattern: string): Promise<number>;
export declare function invalidateCacheAsync(pattern: string): void;
export declare function invalidateCacheBatch(patterns: string[]): Promise<number>;
//# sourceMappingURL=cache.d.ts.map