import { Types } from "mongoose";
import cloudinary from "cloudinary";
import { withTransaction } from "../../utils/withTransaction";
import { createError } from "../../utils/errorHandler";
import { getCache, setCache, invalidateCache } from "../../utils/cache";
import {
    countCourses,
    findCourses,
    findCourseById,
    aggregateCourseDetails,
    createCourse as createCourseRepo,
    updateCourse as updateCourseRepo,
    deleteCourseDependencies,
    deleteCourseById
} from "./course.repository";
import User from "../users/user.model";
import { sendEmail } from "../../utils/email";
import Enrollment from "../enrollments/enrollment.model";
import Chapter from "../chapters/chapter.model";
import Course from "./course.model";
import Review from "../reviews/review.model";
import CourseProgress from "../progress/progress.model";
import { ServiceResponse } from "../../@types/api";

type CourseQueryOptions = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  level?: string;
};

export const updateCourseDuration = async (courseId: string, newDuration?: number, session?: any): Promise<void> => {
  const course = await Course.findById(courseId).session(session);
  if (!course) return;

  if (newDuration !== undefined) {
    course.totalDuration = newDuration;
  } else {
    const chapters = await Chapter.find({ course: courseId }).select('chapterDuration').session(session);
    course.totalDuration = chapters.reduce((total, chapter) => total + (chapter.chapterDuration || 0), 0);
  }
  
  await course.save({ session });
};

export const createCourse = async (courseData: any, instructorId: string): Promise<ServiceResponse<any>> => {
  try {
    let thumbnailData = undefined;

    if (courseData.thumbnail && typeof courseData.thumbnail === 'string') {
      const result = await cloudinary.v2.uploader.upload(courseData.thumbnail, {
        folder: 'course-thumbnails',
        width: 1280,
      });
      thumbnailData = { public_id: result.public_id, url: result.secure_url };
    }

    const course = await createCourseRepo({ 
      ...courseData, 
      instructor: instructorId,
      thumbnail: thumbnailData,
    });
    
    await invalidateCache('courses:list');
    
    const editCourseUrl = `${process.env.FRONTEND_URL}/courses/${course._id}/edit`;
    const instructor = await User.findById(instructorId).lean();
    if (instructor) { 
      await sendEmail(
        instructor.email,
        'New Course Created',
        'course-created',
        { instructorName: instructor.name, courseTitle: course.title, editCourseUrl}
      );
    }
    
    return {
      success: true,
      data: course,
      message: 'Course created successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Course creation failed',
      errors: [error.message]
    };
  }
};

export const updateCourse = async (courseId: string, updateData: any, instructorId: string, instructorRole: string): Promise<ServiceResponse<any>> => {
  try {
    const course = await findCourseById(courseId);
    if (!course) {
      return {
        success: false,
        message: 'Course not found',
        errors: ['No course found with the provided ID']
      };
    }

    if (instructorRole !== 'admin' && course.instructor.toString() !== instructorId) {
      return {
        success: false,
        message: 'You are not authorized to update this course',
        errors: ['Insufficient permissions to update this course']
      };
    }

    let thumbnailData = undefined;
    if (updateData.thumbnail && typeof updateData.thumbnail === 'string') {
      if (course.thumbnail?.public_id) {
        await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
      }
      
      const result = await cloudinary.v2.uploader.upload(updateData.thumbnail, {
        folder: 'course-thumbnails',
        width: 1280,
      });
      thumbnailData = { public_id: result.public_id, url: result.secure_url };
      updateData.thumbnail = thumbnailData;
    }

    const updatedCourse = await updateCourseRepo(courseId, updateData);
    
    await invalidateCache(`course:${courseId}`);
    await invalidateCache('courses:list');
    
    const instructor = await User.findById(instructorId).lean();
    if (instructor && updateData.status === 'published' && updatedCourse) {
      const editCourseUrl = `${process.env.FRONTEND_URL}/courses/${courseId}/edit`;
      const viewCourseUrl = `${process.env.FRONTEND_URL}/courses/${courseId}`;
      await sendEmail(
        instructor.email,
        'Course Updated',
        'course-updated',
        { 
          instructorName: instructor.name, 
          courseTitle: updatedCourse.title, 
          editCourseUrl,
          viewCourseUrl
        }
      );
    }
    
    return {
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Course update failed',
      errors: [error.message]
    };
  }
};

export const deleteCourse = async (courseId: string, instructorId: string, instructorRole: string): Promise<ServiceResponse<null>> => {
  try {
    await withTransaction(async (session) => {
      const course = await findCourseById(courseId, session);
      if (!course) throw createError('Course not found', 404);
      if (instructorRole !== 'admin' && course.instructor.toString() !== instructorId) {
          throw createError('You are not authorized to delete this course', 403);
      }
      
      const chapters = await Chapter.find({ course: courseId }).session(session);
      const chapterIds = chapters.map(c => c._id);

      await deleteCourseDependencies(courseId, chapterIds as Types.ObjectId[], session);

      if (course.thumbnail?.public_id) {
        await cloudinary.v2.uploader.destroy(course.thumbnail.public_id);
      }

      await deleteCourseById(courseId, session);

      await invalidateCache(`course:${courseId}`);
      await invalidateCache('courses:list');
      
      const instructor = await User.findById(instructorId).lean();
      if (instructor) {
        const createNewCourseUrl = `${process.env.FRONTEND_URL}/courses/create`;
        await sendEmail(
          instructor.email,
          'Course Deleted',
          'course-deleted',
          { 
            instructorName: instructor.name, 
            courseTitle: course.title,
            createNewCourseUrl
          }
        );
      }
    });
    
    return {
      success: true,
      data: null,
      message: 'Course deleted successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Course deletion failed',
      errors: [error.message]
    };
  }
};

export const getAllCoursesService = async (options: CourseQueryOptions, cacheKey?: string): Promise<ServiceResponse<{ data: any[]; pagination: any }>> => {
  try {
    if (cacheKey) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Courses retrieved from cache'
        };
      }
    }

    const { search, category, level } = options;

    const query: any = { status: 'published' }; 

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    
    const totalCourses = await countCourses(query);
    const courses = await findCourses(query, options);

    const responseData = {
      data: courses,
      pagination: {
        page: options.page,
        limit: options.limit,
        total: totalCourses,
        totalPages: Math.ceil(totalCourses / options.limit),
      }
    };

    if (cacheKey) {
      await setCache(cacheKey, responseData, 300);
    }

    return {
      success: true,
      data: responseData,
      message: 'Courses retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve courses',
      errors: [error.message]
    };
  }
};

export const checkEnrollmentStatus = async (courseId: string, userId: string): Promise<boolean> => {
  const userIdObj = new Types.ObjectId(userId);
  const courseIdObj = new Types.ObjectId(courseId);
  
  const enrollment = await Enrollment.exists({ 
    course: courseIdObj, 
    student: userIdObj 
  });
  
  return !!enrollment;
};

export const getCourseDetails = async (courseId: string, userId?: string, cacheKey?: string): Promise<ServiceResponse<any>> => {
  try {
    if (cacheKey) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Course details retrieved from cache'
        };
      }
    }

    const result = await aggregateCourseDetails(courseId);

    if (!result || result.length === 0) {
      return {
        success: false,
        message: 'Course not found',
        errors: ['No course found with the provided ID']
      };
    }

    const courseData = result[0];
    
    if (cacheKey) {
      await setCache(cacheKey, courseData, 600);
    }

    return {
      success: true,
      data: courseData,
      message: 'Course details retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve course details',
      errors: [error.message]
    };
  }
};

export const searchCourses = async (filters: {
  category?: string;
  level?: string;
  priceRange?: { min: number; max: number };
  rating?: number;
  instructor?: string;
  search?: string;
}) => {
  const query = Course.find({ status: 'published' });
  
  if (filters.category) query.where('category', filters.category);
  if (filters.level) query.where('level', filters.level);
  if (filters.rating) query.where('averageRating').gte(filters.rating);
  if (filters.search) query.where({ $text: { $search: filters.search } });
  if (filters.priceRange) {
    query.where('price').gte(filters.priceRange.min).lte(filters.priceRange.max);
  }
  
  return query.populate('instructor', 'name email avatar').sort({ createdAt: -1 });
};

export const getRecommendedCourses = async (userId: string): Promise<ServiceResponse<any[]>> => {
  try {
    const enrolledCourses = await Enrollment.find({ user: userId })
      .populate('course', 'category level')
      .lean();
    
    let courses;
    
    if (enrolledCourses.length === 0) {
      courses = await Course.find({ status: 'published' })
        .populate('instructor', 'name avatar')
        .sort({ enrollmentCount: -1, averageRating: -1 })
        .limit(6)
        .lean();
    } else {
      const categories = enrolledCourses.map(e => (e.course as any).category);
      const enrolledCourseIds = enrolledCourses.map(e => e.course?._id?.toString()).filter(Boolean);
      
      courses = await Course.find({
        category: { $in: categories },
        _id: { $nin: enrolledCourseIds },
        status: 'published'
      })
      .populate('instructor', 'name avatar')
      .limit(6)
      .lean();
    }
    
    return {
      success: true,
      data: courses,
      message: 'Recommended courses retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve recommended courses',
      errors: [error.message]
    };
  }
};

export const getCourseAnalytics = async (courseId: string): Promise<ServiceResponse<any>> => {
  try {
    const [course, enrollments, reviews, progress] = await Promise.all([
      Course.findById(courseId),
      Enrollment.countDocuments({ course: courseId }),
      Review.find({ course: courseId }),
      CourseProgress.find({ course: courseId })
    ]);
    
    if (!course) {
      return {
        success: false,
        message: 'Course not found',
        errors: ['No course found with the provided ID']
      };
    }
    
    const completionRate = progress.length > 0 
      ? (progress.filter(p => p.isCourseCompleted).length / progress.length) * 100 
      : 0;
    
    return {
      success: true,
      data: {
        course: course.title,
        enrollments,
        reviews: reviews.length,
        averageRating: course.averageRating,
        completionRate: Math.round(completionRate),
        totalRevenue: enrollments * course.price
      },
      message: 'Course analytics retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve course analytics',
      errors: [error.message]
    };
  }
};

export const getFeaturedCourses = async (limit: number = 6): Promise<ServiceResponse<any[]>> => {
  try {
    const courses = await Course.find({ 
      status: 'published',
      averageRating: { $gte: 4.0 }
    })
    .populate('instructor', 'name avatar')
    .sort({ enrollmentCount: -1, averageRating: -1 })
    .limit(limit);
    
    return {
      success: true,
      data: courses,
      message: 'Featured courses retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve featured courses',
      errors: [error.message]
    };
  }
};

export const getCoursesByInstructor = async (instructorId: string): Promise<ServiceResponse<any[]>> => {
  try {
    const courses = await Course.find({ instructor: instructorId })
      .populate('instructor', 'name email avatar')
      .sort({ createdAt: -1 });
    
    return {
      success: true,
      data: courses,
      message: 'Instructor courses retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve instructor courses',
      errors: [error.message]
    };
  }
};

export const getCourseStats = async (courseId: string): Promise<ServiceResponse<any>> => {
  try {
    const [course, enrollments, reviews, progress, totalLectures] = await Promise.all([
      Course.findById(courseId),
      Enrollment.countDocuments({ course: courseId }),
      Review.find({ course: courseId }),
      CourseProgress.find({ course: courseId }),
      Chapter.aggregate([
        { $match: { course: courseId } },
        { $unwind: '$content' },
        { $match: { 'content.type': 'lecture' } },
        { $count: 'total' }
      ])
    ]);
    
    if (!course) {
      return {
        success: false,
        message: 'Course not found',
        errors: ['No course found with the provided ID']
      };
    }
    
    const completedCourses = progress.filter(p => p.isCourseCompleted).length;
    const completionRate = enrollments > 0 ? (completedCourses / enrollments) * 100 : 0;
    
    return {
      success: true,
      data: {
        course: {
          title: course.title,
          price: course.price,
          averageRating: course.averageRating,
          reviewCount: course.reviewCount
        },
        stats: {
          enrollments,
          totalLectures: totalLectures[0]?.total || 0,
          completedCourses,
          completionRate: Math.round(completionRate),
          averageReviewRating: reviews.length > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
            : 0
        }
      },
      message: 'Course statistics retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve course statistics',
      errors: [error.message]
    };
  }
};