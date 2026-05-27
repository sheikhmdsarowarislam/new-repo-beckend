"use strict";
// src/modules/courses/course.controller.ts
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
exports.getCoursesByInstructorController = exports.getCourseStatsController = exports.getCourseAnalyticsController = exports.getFeaturedCoursesController = exports.getRecommendedCoursesController = exports.getCourseByIdController = exports.getAllCoursesController = exports.deleteCourseController = exports.updateCourseController = exports.createCourseController = void 0;
const courseService = __importStar(require("./course.service"));
const catchAsync_1 = require("../../middlewares/catchAsync");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// Create a new course (Instructor only)
exports.createCourseController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instructorId = (0, common_1.getUserId)(req);
    const result = await courseService.createCourse(req.body, instructorId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Course creation failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, result.data, 'Course created successfully');
});
// Update a course (Instructor only)
exports.updateCourseController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const courseId = req.params.id;
    const instructorId = (0, common_1.getUserId)(req);
    const instructorRole = (0, common_1.getUserRole)(req);
    const result = await courseService.updateCourse(courseId, req.body, instructorId, instructorRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Course update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Course updated successfully');
});
// Delete a course (Instructor only)
exports.deleteCourseController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const courseId = req.params.id;
    const instructorId = (0, common_1.getUserId)(req);
    const instructorRole = (0, common_1.getUserRole)(req);
    const result = await courseService.deleteCourse(courseId, instructorId, instructorRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Course deletion failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, undefined, 'Course deleted successfully');
});
// Get a list of all courses with pagination
exports.getAllCoursesController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { page, limit, search, category, level } = (0, common_1.getPaginationParams)(req);
    const result = await courseService.getAllCoursesService({
        page,
        limit,
        search,
        category,
        level,
    });
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve courses', 500, result.errors);
    }
    const { data, pagination } = result.data;
    return (0, response_1.sendPaginated)(res, data, pagination, 'Courses retrieved successfully');
});
// Get a single course by ID (Public - Preview content only)
exports.getCourseByIdController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const courseId = req.params.id;
    const result = await courseService.getCourseDetails(courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Course not found', 404, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Course retrieved successfully');
});
// Get recommended courses for user
exports.getRecommendedCoursesController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await courseService.getRecommendedCourses(userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve recommended courses', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Recommended courses retrieved successfully');
});
// Get featured courses
exports.getFeaturedCoursesController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const limit = parseInt(req.query.limit || '6', 10);
    const result = await courseService.getFeaturedCourses(limit);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve featured courses', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Featured courses retrieved successfully');
});
// Get course analytics
exports.getCourseAnalyticsController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const courseId = req.params.id;
    const result = await courseService.getCourseAnalytics(courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve course analytics', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Course analytics retrieved successfully');
});
// Get course statistics
exports.getCourseStatsController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const courseId = req.params.id;
    const result = await courseService.getCourseStats(courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve course statistics', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Course statistics retrieved successfully');
});
// Get courses by instructor
exports.getCoursesByInstructorController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const instructorId = req.params.instructorId;
    const result = await courseService.getCoursesByInstructor(instructorId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve instructor courses', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Instructor courses retrieved successfully');
});
//# sourceMappingURL=course.controller.js.map