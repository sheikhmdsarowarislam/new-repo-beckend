// Standardized API response utilities

import { Response } from 'express';
import { ApiResponse } from '../@types/api';

/**
 * Send a successful response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200,
  meta?: ApiResponse['meta']
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    meta
  };

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: string[]
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    errors
  };

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message?: string,
  cached?: boolean
): Response => {
  const response: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: pagination.totalPages,
      cached: !!cached
    }
  };

  return res.status(200).json(response);
};

/**
 * Send a created response
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a no content response
 */
export const sendNoContent = (res: Response, message: string = 'Operation completed successfully'): Response => {
  return sendSuccess(res, undefined, message, 204);
};

/**
 * Send a validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: string[],
  message: string = 'Validation failed'
): Response => {
  return sendError(res, message, 400, errors);
};

/**
 * Send a not found response
 */
export const sendNotFound = (res: Response, message: string = 'Resource not found'): Response => {
  return sendError(res, message, 404);
};

/**
 * Send an unauthorized response
 */
export const sendUnauthorized = (res: Response, message: string = 'Unauthorized access'): Response => {
  return sendError(res, message, 401);
};

/**
 * Send a forbidden response
 */
export const sendForbidden = (res: Response, message: string = 'Forbidden access'): Response => {
  return sendError(res, message, 403);
};
