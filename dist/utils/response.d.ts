import { Response } from 'express';
import { ApiResponse } from '../@types/api';
/**
 * Send a successful response
 */
export declare const sendSuccess: <T>(res: Response, data?: T, message?: string, statusCode?: number, meta?: ApiResponse["meta"]) => Response;
/**
 * Send an error response
 */
export declare const sendError: (res: Response, message: string, statusCode?: number, errors?: string[]) => Response;
/**
 * Send a paginated response
 */
export declare const sendPaginated: <T>(res: Response, data: T[], pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}, message?: string, cached?: boolean) => Response;
/**
 * Send a created response
 */
export declare const sendCreated: <T>(res: Response, data: T, message?: string) => Response;
/**
 * Send a no content response
 */
export declare const sendNoContent: (res: Response, message?: string) => Response;
/**
 * Send a validation error response
 */
export declare const sendValidationError: (res: Response, errors: string[], message?: string) => Response;
/**
 * Send a not found response
 */
export declare const sendNotFound: (res: Response, message?: string) => Response;
/**
 * Send an unauthorized response
 */
export declare const sendUnauthorized: (res: Response, message?: string) => Response;
/**
 * Send a forbidden response
 */
export declare const sendForbidden: (res: Response, message?: string) => Response;
//# sourceMappingURL=response.d.ts.map