"use strict";
// Simplified error handling utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.handleProcessErrors = exports.globalErrorHandler = exports.asyncHandler = exports.AppError = void 0;
const response_1 = require("./response");
const constants_1 = require("./constants");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
/**
 * Handle async errors
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
/**
 * Global error handler
 */
const globalErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Set default error properties
    error.statusCode = error.statusCode || constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR;
    error.status = error.status || 'error';
    // Handle specific error types
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((val) => val.message);
        error.message = 'Validation failed';
        error.statusCode = constants_1.HTTP_STATUS.BAD_REQUEST;
        return (0, response_1.sendError)(res, error.message, error.statusCode, errors);
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        const value = field ? err.keyValue[field] : 'unknown';
        error.message = `${field} '${value}' already exists`;
        error.statusCode = constants_1.HTTP_STATUS.CONFLICT;
    }
    if (err.name === 'CastError') {
        error.message = `Invalid ${err.path}: ${err.value}`;
        error.statusCode = constants_1.HTTP_STATUS.BAD_REQUEST;
    }
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token. Please log in again.';
        error.statusCode = constants_1.HTTP_STATUS.UNAUTHORIZED;
    }
    if (err.name === 'TokenExpiredError') {
        error.message = 'Your token has expired. Please log in again.';
        error.statusCode = constants_1.HTTP_STATUS.UNAUTHORIZED;
    }
    // Send error response
    if (process.env.NODE_ENV === 'development') {
        return (0, response_1.sendError)(res, error.message, error.statusCode);
    }
    // Production: only send operational errors to client
    if (error.isOperational) {
        return (0, response_1.sendError)(res, error.message, error.statusCode);
    }
    // Log unknown errors and send generic message
    console.error('ERROR 💥', err);
    return (0, response_1.sendError)(res, 'Something went wrong!', constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR);
};
exports.globalErrorHandler = globalErrorHandler;
/**
 * Handle unhandled promise rejections and uncaught exceptions
 */
const handleProcessErrors = () => {
    process.on('unhandledRejection', (err) => {
        console.log('UNHANDLED REJECTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        process.exit(1);
    });
    process.on('uncaughtException', (err) => {
        console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        console.log(err.name, err.message);
        process.exit(1);
    });
};
exports.handleProcessErrors = handleProcessErrors;
/**
 * Create a custom error (alias for AppError constructor)
 */
const createError = (message, statusCode) => {
    return new AppError(message, statusCode);
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map