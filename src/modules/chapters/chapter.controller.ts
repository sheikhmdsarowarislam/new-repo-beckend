// src/modules/chapters/chapter.controller.ts (Refactored with catchAsync)
import { Response, NextFunction } from "express";
import * as chapterService from "./chapter.service";
import { ICreateChapterData, UserRole } from "./chapter.service";
import { catchAsync } from "../../middlewares/catchAsync";
import { AppError } from "../../utils/errorHandler";
import { getUserId, getUserRole } from "../../utils/common";
import { sendSuccess, sendCreated, sendError } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

// --- Type Definitions (Re-used) ---

// Request interface combining Auth and Caching
interface ChapterAuthRequest extends AuthRequest {
    cacheKey?: string;
    params: {
        id?: string;
        courseId?: string;
        chapterId?: string;
    };
    body: any; // The validated and flattened body content
}

// --- CONTROLLER HANDLERS (CLEANED WITH CATCHASYNC) ---

export const createChapterHandler = catchAsync(async (req: ChapterAuthRequest, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req) as UserRole;

    const result = await chapterService.createChapter(
        req.body as ICreateChapterData, 
        userId, 
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Chapter creation failed', 400, result.errors);
    }
    
    return sendCreated(res, result.data, 'Chapter created successfully');
});




export const updateChapterHandler = catchAsync(async (req: ChapterAuthRequest, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req) as UserRole;

    const result = await chapterService.updateChapter(
        req.params.id as string, 
        req.body,
        userId, 
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Chapter update failed', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Chapter updated successfully');
});

export const deleteChapterHandler = catchAsync(async (req: ChapterAuthRequest, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req) as UserRole;

    const result = await chapterService.deleteChapterService(
        req.params.id as string, 
        userId, 
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Chapter deletion failed', 400, result.errors);
    }
    
    return sendSuccess(res, undefined, 'Chapter and all associated lectures deleted successfully');
});

// Note: Read operations still need explicit checks for cacheKey and 404s.

export const getChaptersHandler = catchAsync(async (req: ChapterAuthRequest, res: Response, next: NextFunction) => {
    const result = await chapterService.getChaptersByCourse(req.params.courseId as string);
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve chapters', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Chapters retrieved successfully');
});

export const getChapterHandler = catchAsync(async (req: ChapterAuthRequest, res: Response, next: NextFunction) => {
    const result = await chapterService.getChapterById(req.params.id as string);

    if (!result.success) {
        return sendError(res, result.message || 'Chapter not found', 404, result.errors);
    }

    return sendSuccess(res, result.data, 'Chapter retrieved successfully');
});

export const reorderChaptersHandler = catchAsync(async (req: ChapterAuthRequest, res: Response, next: NextFunction) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req) as UserRole;

    const { courseId, order } = req.body; 
    const result = await chapterService.reorderChapters(
        courseId as string, 
        order,
        userId, 
        userRole
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Chapter reordering failed', 400, result.errors);
    }
    
    return sendSuccess(res, undefined, 'Chapters reordered successfully');
});

export const reorderChapterContentHandler = catchAsync(async (req: ChapterAuthRequest, res: Response, next: NextFunction) => {
    const chapterId = req.params.chapterId;
    const { items } = req.body;

    if (!chapterId) {
        return sendError(res, 'Chapter ID is required', 400);
    }

    const result = await chapterService.reorderChapterContent(chapterId, items);
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to reorder content', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Chapter content reordered successfully');
});