// utils/cacheKey.ts
export const generateCacheKey = (base: string, params: Record<string, any> = {}): string => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${String(v)}`);
  return parts.length ? `${base}:${parts.join(":")}` : base;
};