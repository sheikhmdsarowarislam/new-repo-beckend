import { CACHE_PREFIX, DEFAULT_TTL } from "../config/cacheConfig";
import { redis } from "../config/redis";

export const namespacedKey = (key: string) => `${CACHE_PREFIX}${key}`;

export async function setCache(key: string, value: any, ttlSeconds = DEFAULT_TTL) {
  const namespacedKeyValue = namespacedKey(key);
  await redis.set(namespacedKeyValue, JSON.stringify(value), "EX", ttlSeconds);
  console.log(`💾 Cache SET: ${key} (${namespacedKeyValue}) with TTL: ${ttlSeconds}s`);
}

export async function getCacheWithTTL<T = any>(key: string): Promise<{ data: T | null; ttl: number } | null> {
  const namespaced = namespacedKey(key);
  
  const result = await redis.multi().get(namespaced).ttl(namespaced).exec() as [string | null, string | null][];

  if (!result || !result[0] || !result[1]) {
    return null;
  }
  
  const [data, ttl] = [result[0][1], result[1][1]];
  
  if (!data) {
    return null;
  }
  
  return { data: JSON.parse(data), ttl: Number(ttl) };
}

export async function getCache<T = any>(key: string): Promise<T | null> {
    const namespaced = namespacedKey(key);
    const data = await redis.get(namespaced);
    return data ? JSON.parse(data) : null;
}

export async function invalidateCache(pattern: string): Promise<number> {
  try {
    let cursor = "0";
    let deletedCount = 0;
    const startTime = Date.now();
    const timeout = 5000;
    const searchPattern = namespacedKey(`${pattern}*`);

    console.log(`🔍 Invalidating cache pattern: ${pattern} (full pattern: ${searchPattern})`);

    do {
      if (Date.now() - startTime > timeout) {
        console.warn(`Cache invalidation timeout for pattern: ${pattern}`);
        break;
      }

      const [nextCursor, keys] = await Promise.race([
        redis.scan(cursor, "MATCH", searchPattern, "COUNT", 100),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Cache scan timeout')), 2000)
        )
      ]);

      if (keys.length > 0) {
        console.log(`🗑️  Deleting ${keys.length} cache keys:`, keys);
        const result = await Promise.race([
          redis.del(...keys),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Cache delete timeout')), 2000)
          )
        ]);
        deletedCount += result;
      }
      cursor = nextCursor;
    } while (cursor !== "0");

    console.log(`✅ Cache invalidation complete: ${deletedCount} keys deleted for pattern: ${pattern}`);
    return deletedCount;
  } catch (error) {
    console.error(`❌ Cache invalidation failed for pattern ${pattern}:`, error);
    return 0;
  }
}

export function invalidateCacheAsync(pattern: string): void {
  invalidateCache(pattern).catch(error => {
    console.error(`Async cache invalidation failed for pattern ${pattern}:`, error);
  });
}

export async function invalidateCacheBatch(patterns: string[]): Promise<number> {
  const promises = patterns.map(pattern => invalidateCache(pattern));
  const results = await Promise.allSettled(promises);
  
  return results.reduce((total, result) => {
    if (result.status === 'fulfilled') {
      return total + result.value;
    }
    return total;
  }, 0);
}