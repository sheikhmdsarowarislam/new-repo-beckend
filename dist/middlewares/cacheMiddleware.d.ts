import { Request, Response, NextFunction } from "express";
export interface CacheMiddlewareOptions {
    param?: string;
    isList?: boolean;
}
export declare const cacheMiddleware: (baseKey: string, options?: CacheMiddlewareOptions) => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=cacheMiddleware.d.ts.map