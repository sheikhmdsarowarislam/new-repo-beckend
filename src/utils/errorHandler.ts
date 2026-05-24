// Simplified error handling utilities

import { Request, Response, NextFunction } from 'express';
import { sendError } from './response';
import { HTTP_STATUS } from './constants';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Handle async errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler
 */
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Set default error properties
  error.statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  error.status = error.status || 'error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => val.message);
    error.message = 'Validation failed';
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
    return sendError(res, error.message, error.statusCode, errors);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = field ? err.keyValue[field] : 'unknown';
    error.message = `${field} '${value}' already exists`;
    error.statusCode = HTTP_STATUS.CONFLICT;
  }

  if (err.name === 'CastError') {
    error.message = `Invalid ${err.path}: ${err.value}`;
    error.statusCode = HTTP_STATUS.BAD_REQUEST;
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token. Please log in again.';
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Your token has expired. Please log in again.';
    error.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    return sendError(res, error.message, error.statusCode);
  }

  // Production: only send operational errors to client
  if (error.isOperational) {
    return sendError(res, error.message, error.statusCode);
  }

  // Log unknown errors and send generic message
  console.error('ERROR 💥', err);
  return sendError(res, 'Something went wrong!', HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

/**
 * Handle unhandled promise rejections and uncaught exceptions
 */
export const handleProcessErrors = () => {
  process.on('unhandledRejection', (err: any) => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });

  process.on('uncaughtException', (err: any) => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

/**
 * Create a custom error (alias for AppError constructor)
 */
export const createError = (message: string, statusCode?: number): AppError => {
  return new AppError(message, statusCode);
};
