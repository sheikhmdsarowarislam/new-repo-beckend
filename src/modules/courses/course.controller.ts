// src/modules/courses/course.controller.ts

import { Request, Response } from 'express';
import * as courseService from './course.service';
import { catchAsync } from '../../middlewares/catchAsync';
import { AuthRequest } from '../../middlewares/auth';
import { getUserId, getUserRole, getPaginationParams } from '../../utils/common';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../../utils/response';


// Create a new course (Instructor only)
export const createCourseController = catchAsync(async (req: AuthRequest, res: Response) => {
  const instructorId = getUserId(req);
  const result = await courseService.createCourse(req.body, instructorId);
  
  if (!result.success) {
    return sendError(res, result.message || 'Course creation failed', 400, result.errors);
  }
  
  return sendCreated(res, result.data, 'Course created successfully');
});

// Update a course (Instructor only)
export const updateCourseController = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.id as string;
  const instructorId = getUserId(req);
  const instructorRole = getUserRole(req);

  const result = await courseService.updateCourse(courseId, req.body, instructorId, instructorRole);
  
  if (!result.success) {
    return sendError(res, result.message || 'Course update failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Course updated successfully');
});

// Delete a course (Instructor only)
export const deleteCourseController = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.id as string;
  const instructorId = getUserId(req);
  const instructorRole = getUserRole(req);
  
  const result = await courseService.deleteCourse(courseId, instructorId, instructorRole);
  
  if (!result.success) {
    return sendError(res, result.message || 'Course deletion failed', 400, result.errors);
  }
  
  return sendSuccess(res, undefined, 'Course deleted successfully');
});

// Get a list of all courses with pagination
export const getAllCoursesController = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, search, category, level } = getPaginationParams(req);

  const result = await courseService.getAllCoursesService({
    page,
    limit,
    search,
    category,
    level,
  });

  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve courses', 500, result.errors);
  }

  const { data, pagination } = result.data!;
  return sendPaginated(res, data, pagination, 'Courses retrieved successfully');
});


// Get a single course by ID (Public - Preview content only)
export const getCourseByIdController = catchAsync(async (req: Request, res: Response) => {
  const courseId = req.params.id as string;
  
  const result = await courseService.getCourseDetails(courseId);
  
  if (!result.success) {
    return sendError(res, result.message || 'Course not found', 404, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Course retrieved successfully');
});

// Get recommended courses for user
export const getRecommendedCoursesController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const result = await courseService.getRecommendedCourses(userId);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve recommended courses', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Recommended courses retrieved successfully');
});

// Get featured courses
export const getFeaturedCoursesController = catchAsync(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '6', 10);
  const result = await courseService.getFeaturedCourses(limit);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve featured courses', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Featured courses retrieved successfully');
});

// Get course analytics
export const getCourseAnalyticsController = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.id as string;
  const result = await courseService.getCourseAnalytics(courseId);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve course analytics', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Course analytics retrieved successfully');
});

// Get course statistics
export const getCourseStatsController = catchAsync(async (req: AuthRequest, res: Response) => {
  const courseId = req.params.id as string;
  const result = await courseService.getCourseStats(courseId);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve course statistics', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Course statistics retrieved successfully');
});

// Get courses by instructor
export const getCoursesByInstructorController = catchAsync(async (req: Request, res: Response) => {
  const instructorId = req.params.instructorId as string;
  const result = await courseService.getCoursesByInstructor(instructorId);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve instructor courses', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Instructor courses retrieved successfully');
});