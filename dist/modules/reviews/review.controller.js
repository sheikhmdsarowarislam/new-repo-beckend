"use strict";
// src/modules/reviews/review.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructorReviewsHandler = exports.getCourseReviewStatsHandler = exports.getUserReviewsHandler = exports.getCourseReviewsHandler = exports.getReviewHandler = exports.deleteReviewHandler = exports.updateReviewHandler = exports.createReviewHandler = void 0;
const reviewService = __importStar(require("./review.service"));
const catchAsync_1 = require("../../middlewares/catchAsync");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// --- CONTROLLER HANDLERS ---
exports.createReviewHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { course, rating, comment } = req.body;
    const result = await reviewService.createReviewService(userId, course, rating, comment);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Review creation failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, result.data, 'Review created successfully');
});
exports.updateReviewHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    if (!req.params.id) {
        return (0, response_1.sendError)(res, 'Review ID missing', 400);
    }
    const { rating, comment } = req.body;
    const result = await reviewService.updateReviewService(req.params.id, userId, rating, comment);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Review update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Review updated successfully');
});
exports.deleteReviewHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    if (!req.params.id) {
        return (0, response_1.sendError)(res, 'Review ID missing', 400);
    }
    const result = await reviewService.deleteReviewService(req.params.id, userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Review deletion failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, undefined, 'Review deleted successfully');
});
exports.getReviewHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await reviewService.getReviewByIdService(req.params.id);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Review not found', 404, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Review retrieved successfully');
});
exports.getCourseReviewsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page, limit } = (0, common_1.getPaginationParams)(req);
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';
    const options = {
        page,
        limit,
        sortBy,
        sortOrder
    };
    const result = await reviewService.getCourseReviewsService(req.params.courseId, options);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve course reviews', 500, result.errors);
    }
    const { data, pagination } = result.data;
    return (0, response_1.sendPaginated)(res, data, pagination, 'Course reviews retrieved successfully');
});
exports.getUserReviewsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { page, limit } = (0, common_1.getPaginationParams)(req);
    const options = {
        page,
        limit
    };
    const result = await reviewService.getUserReviewsService(userId, options);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve user reviews', 500, result.errors);
    }
    const { data, pagination } = result.data;
    return (0, response_1.sendPaginated)(res, data, pagination, 'User reviews retrieved successfully');
});
exports.getCourseReviewStatsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await reviewService.getCourseReviewStatsService(req.params.courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve review stats', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Review stats retrieved successfully');
});
exports.getInstructorReviewsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instructorId = req.params.instructorId;
    if (!instructorId) {
        return (0, response_1.sendError)(res, 'Instructor ID is required', 400);
    }
    // Verify the user is the instructor or admin
    const requestingUserId = (0, common_1.getUserId)(req);
    const userRole = req.user?.role;
    if (requestingUserId !== instructorId && userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Unauthorized to access these reviews', 403);
    }
    const result = await reviewService.getInstructorReviewsService(instructorId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve reviews', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Instructor reviews retrieved successfully');
});
//# sourceMappingURL=review.controller.js.map