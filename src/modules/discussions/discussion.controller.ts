// src/modules/discussions/discussion.controller.ts

import { Response } from "express";
import * as discussionService from "./discussion.service";
import { ICreateDiscussionBody, IAnswerDiscussionBody, IUpdateDiscussionBody } from "./discussion.validation";
import { catchAsync } from "../../middlewares/catchAsync";
import { getUserId, getUserRole, getPaginationParams } from "../../utils/common";
import { sendSuccess, sendCreated, sendError, sendPaginated } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

// --- Type Definitions ---
interface DiscussionAuthRequest extends AuthRequest {
    cacheKey?: string;
    params: {
        id?: string;
        lectureId?: string;
        courseId?: string;
    };
    query: {
        page?: string;
        limit?: string;
        hasAnswers?: string;
    };
    body: any; 
}

// --- CONTROLLER HANDLERS ---

export const createDiscussionHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    const userId = getUserId(req);

    const { lecture, question } = req.body as ICreateDiscussionBody;
    const result = await discussionService.createDiscussionService(
        userId, 
        lecture, 
        question
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Discussion creation failed', 400, result.errors);
    }
    
    return sendCreated(res, result.data, 'Discussion created successfully');
});

export const answerDiscussionHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    if (!req.params.id) {
        return sendError(res, 'Discussion ID missing', 400);
    }

    const { text } = req.body as IAnswerDiscussionBody;
    
    // Check if user is instructor for the course
    const isInstructor = userRole === 'instructor' || userRole === 'admin';
    
    const result = await discussionService.answerQuestionService(
        req.params.id, 
        userId, 
        text,
        isInstructor
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Answer submission failed', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Answer submitted successfully');
});

export const updateDiscussionHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    if (!req.params.id) {
        return sendError(res, 'Discussion ID missing', 400);
    }

    const { question } = req.body as IUpdateDiscussionBody;
    const result = await discussionService.updateDiscussionService(
        req.params.id, 
        userId, 
        question,
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Discussion update failed', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Discussion updated successfully');
});

export const deleteDiscussionHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    if (!req.params.id) {
        return sendError(res, 'Discussion ID missing', 400);
    }

    const result = await discussionService.deleteDiscussionService(req.params.id, userId, userRole);
    
    if (!result.success) {
        return sendError(res, result.message || 'Discussion deletion failed', 400, result.errors);
    }
    
    return sendSuccess(res, undefined, 'Discussion deleted successfully');
});

export const getDiscussionHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    if (!req.params.id) {
        return sendError(res, 'Discussion ID missing', 400);
    }

    const result = await discussionService.getDiscussionByIdService(req.params.id!);
    
    if (!result.success) {
        return sendError(res, result.message || 'Discussion not found', 404, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Discussion retrieved successfully');
});

export const getLectureDiscussionsHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    if (!req.params.lectureId) {
        return sendError(res, 'Lecture ID missing', 400);
    }

    const { page, limit } = getPaginationParams(req);
    const hasAnswers = req.query.hasAnswers ? req.query.hasAnswers === 'true' : undefined;
    
    const options = {
        page,
        limit,
        hasAnswers
    };

    const result = await discussionService.getLectureDiscussionsService(
        req.params.lectureId!, 
        options
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve lecture discussions', 500, result.errors);
    }
    
    const { discussions, pagination } = result.data!;
    return sendPaginated(res, discussions, pagination, 'Lecture discussions retrieved successfully');
});

export const getCourseDiscussionsHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    if (!req.params.courseId) {
        return sendError(res, 'Course ID missing', 400);
    }

    const { page, limit } = getPaginationParams(req);
    const hasAnswers = req.query.hasAnswers ? req.query.hasAnswers === 'true' : undefined;
    
    const options = {
        page,
        limit,
        hasAnswers
    };

    const result = await discussionService.getCourseDiscussionsService(
        req.params.courseId!, 
        options
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve course discussions', 500, result.errors);
    }
    
    const { discussions, pagination } = result.data!;
    return sendPaginated(res, discussions, pagination, 'Course discussions retrieved successfully');
});

export const getUserDiscussionsHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const { page, limit } = getPaginationParams(req);

    const options = {
        page,
        limit
    };

    const result = await discussionService.getUserDiscussionsService(
        userId, 
        options
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve user discussions', 500, result.errors);
    }
    
    const { discussions, pagination } = result.data!;
    return sendPaginated(res, discussions, pagination, 'User discussions retrieved successfully');
});

export const getEnrolledCoursesDiscussionsHandler = catchAsync(async (req: DiscussionAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const { page, limit } = getPaginationParams(req);
    
    const options = {
        page,
        limit
    };

    const result = await discussionService.getEnrolledCoursesDiscussionsService(
        userId, 
        options
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve enrolled courses discussions', 500, result.errors);
    }
    
    const { discussions, pagination } = result.data!;
    return sendPaginated(res, discussions, pagination, 'Enrolled courses discussions retrieved successfully');
});
