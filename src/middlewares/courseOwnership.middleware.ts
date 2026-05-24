import { Response, NextFunction } from 'express';
import Course from '../modules/courses/course.model';
import { getUserId, getUserRole } from '../utils/common';
import { catchAsync } from './catchAsync';
import { AuthRequest } from './auth';
import { createError } from '../utils/errorHandler';

export const requireCourseOwnership = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const courseId = req.params.id;
  const userId = getUserId(req);
  const userRole = getUserRole(req) as 'admin' | 'instructor' | 'student';

  if (!courseId) {
    throw createError('Course ID is required', 400);
  }

  // Inline ownership validation
  if (userRole === 'admin') {
    next();
    return;
  }
  
  const course = await Course.findById(courseId).lean();
  if (!course) {
    throw createError('Course not found', 404);
  }
  
  if (userRole === 'instructor' && course.instructor.toString() !== userId) {
    throw createError('You do not have permission to modify this course', 403);
  }
  
  next();
});
