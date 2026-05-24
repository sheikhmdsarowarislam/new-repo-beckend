// src/modules/progress/progress.controller.ts

import { Response } from "express";
import * as progressService from "./progress.service";
import { IUpdateLectureProgressBody } from "./progress.validation";
import { catchAsync } from "../../middlewares/catchAsync";
import { getUserId, getUserRole } from "../../utils/common";
import { sendSuccess, sendError } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

// --- Type Definitions ---
interface ProgressAuthRequest extends AuthRequest {
    params: {
        courseId?: string;
        lectureId?: string;
    };
    body: any; 
}

// --- CONTROLLER HANDLERS ---

export const updateLectureProgressHandler = catchAsync(async (req: ProgressAuthRequest, res: Response) => {
    const userId = getUserId(req);

    const { lectureId } = req.params;
    if (!lectureId) {
        return sendError(res, 'Lecture ID is required', 400);
    }
    
    const { progressPercentage } = req.body as IUpdateLectureProgressBody;
    const result = await progressService.updateLectureProgress(
        userId, 
        lectureId, 
        progressPercentage
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Progress update failed', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Lecture progress updated successfully');
});

export const getCourseProgressHandler = async (req: ProgressAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const { courseId } = req.params as { courseId: string };
  
    const result = await progressService.getCourseProgressService(userId, courseId);
  
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve course progress', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Course progress retrieved successfully');
};

export const getUserDashboardHandler = catchAsync(async (req: ProgressAuthRequest, res: Response) => {
    const userId = getUserId(req);

    const result = await progressService.getUserDashboard(userId);
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve dashboard', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Dashboard retrieved successfully');
});

export const getCourseCompletionStatsHandler = catchAsync(async (req: ProgressAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    if (!req.params.courseId) {
        return sendError(res, 'Course ID missing', 400);
    }

    // Only instructors/admins can view course stats
    if (userRole !== 'instructor' && userRole !== 'admin') {
        return sendError(res, 'Insufficient permissions', 403);
    }

    const result = await progressService.getCourseCompletionStats(req.params.courseId);
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve course stats', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Course completion stats retrieved successfully');
});

