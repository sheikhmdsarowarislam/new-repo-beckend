"use strict";
// src/modules/progress/progress.controller.ts
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
exports.getCourseCompletionStatsHandler = exports.getUserDashboardHandler = exports.getCourseProgressHandler = exports.updateLectureProgressHandler = void 0;
const progressService = __importStar(require("./progress.service"));
const catchAsync_1 = require("../../middlewares/catchAsync");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// --- CONTROLLER HANDLERS ---
exports.updateLectureProgressHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { lectureId } = req.params;
    if (!lectureId) {
        return (0, response_1.sendError)(res, 'Lecture ID is required', 400);
    }
    const { progressPercentage } = req.body;
    const result = await progressService.updateLectureProgress(userId, lectureId, progressPercentage);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Progress update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Lecture progress updated successfully');
});
const getCourseProgressHandler = async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { courseId } = req.params;
    const result = await progressService.getCourseProgressService(userId, courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve course progress', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Course progress retrieved successfully');
};
exports.getCourseProgressHandler = getCourseProgressHandler;
exports.getUserDashboardHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await progressService.getUserDashboard(userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve dashboard', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Dashboard retrieved successfully');
});
exports.getCourseCompletionStatsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    if (!req.params.courseId) {
        return (0, response_1.sendError)(res, 'Course ID missing', 400);
    }
    // Only instructors/admins can view course stats
    if (userRole !== 'instructor' && userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const result = await progressService.getCourseCompletionStats(req.params.courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve course stats', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Course completion stats retrieved successfully');
});
//# sourceMappingURL=progress.controller.js.map