// src/modules/quizes/quiz.controller.ts

import { Request, Response, NextFunction } from "express";
import * as quizService from "./quiz.service";
import { AppError } from "../../utils/errorHandler";
import { ICreateQuizBody, IUpdateQuizBody, ISubmitQuizAttemptBody } from "./quiz.validation";
import { catchAsync } from "../../middlewares/catchAsync";
import { getUserId, getUserRole } from "../../utils/common";
import { sendSuccess, sendCreated, sendError } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

// --- Type Definitions ---
interface QuizAuthRequest extends AuthRequest {
    cacheKey?: string;
    params: {
        id?: string;
        courseId?: string;
    };
    body: any; 
}

// --- Helper Functions ---
// Enrollment check removed - access control is handled at route/middleware level

// --- CONTROLLER HANDLERS ---

export const createQuizHandler = catchAsync(async (req: QuizAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const result = await quizService.createQuizService(
        req.body as ICreateQuizBody, 
        userId, 
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Quiz creation failed', 400, result.errors);
    }
    
    return sendCreated(res, result.data, 'Quiz created successfully');
});

export const updateQuizHandler = catchAsync(async (req: QuizAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    if (!req.params.id) {
        return sendError(res, 'Quiz ID missing', 400);
    }

    const result = await quizService.updateQuizService(
        req.params.id, 
        req.body as IUpdateQuizBody,
        userId, 
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Quiz update failed', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Quiz updated successfully');
});

export const deleteQuizHandler = catchAsync(async (req: QuizAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    if (!req.params.id) {
        return sendError(res, 'Quiz ID missing', 400);
    }

    const result = await quizService.deleteQuizService(
        req.params.id, 
        userId, 
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Quiz deletion failed', 400, result.errors);
    }
    
    return sendSuccess(res, undefined, 'Quiz deleted successfully');
});

export const getQuizHandler = catchAsync(async (req: QuizAuthRequest, res: Response) => {
    const cacheKey = req.cacheKey;
    if (!cacheKey) {
        return sendError(res, 'Cache key missing from request', 500);
    }
    
    const userId = getUserId(req);
    const userRole = getUserRole(req);

    const result = await quizService.getQuizByIdService(req.params.id!, cacheKey, userId, userRole);

    if (!result.success) {
        return sendError(res, result.message || 'Quiz not found', 404, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Quiz retrieved successfully', 200, { cached: !!cacheKey });
});


export const submitQuizAttemptHandler = catchAsync(async (req: QuizAuthRequest, res: Response) => {
    const userId = getUserId(req);
    
    if (!req.params.id) {
        return sendError(res, 'Quiz ID missing', 400);
    }

    const result = await quizService.submitQuizAttemptService(
        userId,
        req.params.id,
        req.body as ISubmitQuizAttemptBody
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Quiz submission failed', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Quiz submitted successfully');
});

export const getQuizResultsHandler = catchAsync(async (req: QuizAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const cacheKey = req.cacheKey;
    
    if (!req.params.courseId) {
        return sendError(res, 'Course ID missing', 400);
    }

    const result = await quizService.getQuizResultsService(
        userId,
        req.params.courseId,
        cacheKey
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve quiz results', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Quiz results retrieved successfully', 200, { cached: !!cacheKey && result.data.cached });
});
