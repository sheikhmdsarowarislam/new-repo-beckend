"use strict";
// Standardized API response utilities
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendForbidden = exports.sendUnauthorized = exports.sendNotFound = exports.sendValidationError = exports.sendNoContent = exports.sendCreated = exports.sendPaginated = exports.sendError = exports.sendSuccess = void 0;
/**
 * Send a successful response
 */
const sendSuccess = (res, data, message, statusCode = 200, meta) => {
    const response = {
        success: true,
        message,
        data,
        meta
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Send an error response
 */
const sendError = (res, message, statusCode = 500, errors) => {
    const response = {
        success: false,
        message,
        errors
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
/**
 * Send a paginated response
 */
const sendPaginated = (res, data, pagination, message, cached) => {
    const response = {
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
exports.sendPaginated = sendPaginated;
/**
 * Send a created response
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
    return (0, exports.sendSuccess)(res, data, message, 201);
};
exports.sendCreated = sendCreated;
/**
 * Send a no content response
 */
const sendNoContent = (res, message = 'Operation completed successfully') => {
    return (0, exports.sendSuccess)(res, undefined, message, 204);
};
exports.sendNoContent = sendNoContent;
/**
 * Send a validation error response
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
    return (0, exports.sendError)(res, message, 400, errors);
};
exports.sendValidationError = sendValidationError;
/**
 * Send a not found response
 */
const sendNotFound = (res, message = 'Resource not found') => {
    return (0, exports.sendError)(res, message, 404);
};
exports.sendNotFound = sendNotFound;
/**
 * Send an unauthorized response
 */
const sendUnauthorized = (res, message = 'Unauthorized access') => {
    return (0, exports.sendError)(res, message, 401);
};
exports.sendUnauthorized = sendUnauthorized;
/**
 * Send a forbidden response
 */
const sendForbidden = (res, message = 'Forbidden access') => {
    return (0, exports.sendError)(res, message, 403);
};
exports.sendForbidden = sendForbidden;
//# sourceMappingURL=response.js.map