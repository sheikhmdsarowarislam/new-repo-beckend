import { Types } from 'mongoose';
import { createError } from "../../utils/errorHandler";
import { withTransaction } from "../../utils/withTransaction";
import { invalidateCache } from "../../utils/cache";
import Discussion, { IDiscussion } from "./discussion.model";
import Lecture from "../lectures/lecture.model";
import Course from "../courses/course.model";
import Enrollment from "../enrollments/enrollment.model";
import { createNotification } from "../notifications/notification.service";
import { ServiceResponse } from "../../@types/api";

// --- CORE SERVICE FUNCTIONS ---

/**
 * Create discussion
 */
export const createDiscussionService = async (
  userId: string, 
  lectureId: string, 
  question: string
): Promise<ServiceResponse<IDiscussion>> => {
    try {
        const discussion = await withTransaction(async (session) => {
            // OPTIMIZATION: Use lean queries for better performance
            const lecture = await Lecture.findById(lectureId).lean().session(session);
            if (!lecture) throw createError('Lecture not found', 404);
            
            const enrollment = await Enrollment.findOne({ 
                student: userId, 
                course: lecture.course 
            }).lean().session(session);
            
            if (!enrollment) {
                throw createError('Must be enrolled in the course to create discussions', 403);
            }
            
            const [discussion] = await Discussion.create([{
                user: userId,
                lecture: lectureId,
                course: lecture.course,
                question,
                answers: []
            }], { session, ordered: true });

            if (!discussion) throw createError("Failed to create discussion.", 500);
            
            // OPTIMIZATION: Use lean query for course lookup
            const course = await Course.findById(lecture.course).lean().session(session);
            if (course) {
                await createNotification(
                    course.instructor.toString(),
                    'new_question',
                    `New question in ${lecture.title}`,
                    (discussion._id as Types.ObjectId).toString()
                );
            }
            
            return discussion.populate('user', 'name avatar');
        });

        await invalidateCache(`discussions:${lectureId}`);

        return {
            success: true,
            data: discussion,
            message: 'Discussion created successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Discussion creation failed',
            errors: [error.message]
        };
    }
};

/**
 * Answer question
 */
export const answerQuestionService = async (
  discussionId: string, 
  userId: string, 
  text: string, 
  isInstructor: boolean = false
): Promise<ServiceResponse<IDiscussion>> => {
    try {
        const discussion = await withTransaction(async (session) => {
            const discussion = await Discussion.findById(discussionId).session(session);
            if (!discussion) throw createError('Discussion not found', 404);
            
            // OPTIMIZATION: Use lean query for enrollment check
            if (!isInstructor) {
                const enrollment = await Enrollment.findOne({ 
                    student: userId, 
                    course: discussion.course 
                }).lean().session(session);
                
                if (!enrollment) {
                    throw createError('Must be enrolled in the course to answer discussions', 403);
                }
            }
            
            discussion.answers.push({
                user: userId as any,
                text,
                isInstructorAnswer: isInstructor
            } as any);
            
            await discussion.save({ session });
            
            // Notify question asker if different from answerer
            if (discussion.user.toString() !== userId) {
                await createNotification(
                    discussion.user.toString(),
                    'question_answered',
                    `Your question has been answered`,
                    discussionId
                );
            }
            
            return discussion.populate([
                { path: 'user', select: 'name avatar' },
                { path: 'answers.user', select: 'name avatar' }
            ]);
        });

        await invalidateCache(`discussions:${discussion.lecture.toString()}`);

        return {
            success: true,
            data: discussion,
            message: 'Answer submitted successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Answer submission failed',
            errors: [error.message]
        };
    }
};

/**
 * Update discussion
 */
export const updateDiscussionService = async (
  discussionId: string, 
  userId: string, 
  question: string,
  userRole?: string
): Promise<ServiceResponse<IDiscussion>> => {
    try {
        const discussion = await withTransaction(async (session) => {
            const discussion = await Discussion.findById(discussionId).session(session);
            if (!discussion) throw createError('Discussion not found', 404);
            
            // Check permissions: original poster, course instructor, or admin
            const isOriginalPoster = discussion.user.toString() === userId;
            const isAdmin = userRole === 'admin';
            let isCourseInstructor = false;
            
            if (!isOriginalPoster && !isAdmin) {
                // OPTIMIZATION: Use lean query for course instructor check
                const course = await Course.findById(discussion.course).lean().session(session);
                if (course && course.instructor.toString() === userId) {
                    isCourseInstructor = true;
                }
            }
            
            if (!isOriginalPoster && !isAdmin && !isCourseInstructor) {
                throw createError('Unauthorized: Only the original poster, course instructor, or admin can update discussions', 403);
            }
            
            discussion.question = question;
            await discussion.save({ session });
            
            return discussion.populate('user', 'name avatar');
        });

        return {
            success: true,
            data: discussion,
            message: 'Discussion updated successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Discussion update failed',
            errors: [error.message]
        };
    }
};

/**
 * Delete discussion
 */
export const deleteDiscussionService = async (
  discussionId: string, 
  userId: string,
  userRole?: string
): Promise<ServiceResponse<any>> => {
    try {
        await withTransaction(async (session) => {
            const discussion = await Discussion.findById(discussionId).session(session);
            if (!discussion) throw createError('Discussion not found', 404);
            
            // Check permissions: original poster, course instructor, or admin
            const isOriginalPoster = discussion.user.toString() === userId;
            const isAdmin = userRole === 'admin';
            let isCourseInstructor = false;
            
            if (!isOriginalPoster && !isAdmin) {
                // OPTIMIZATION: Use lean query for course instructor check
                const course = await Course.findById(discussion.course).lean().session(session);
                if (course && course.instructor.toString() === userId) {
                    isCourseInstructor = true;
                }
            }
            
            if (!isOriginalPoster && !isAdmin && !isCourseInstructor) {
                throw createError('Unauthorized: Only the original poster, course instructor, or admin can delete discussions', 403);
            }
            
            // Delete the discussion
            await Discussion.findByIdAndDelete(discussionId).session(session);
        });

        return {
            success: true,
            data: undefined,
            message: 'Discussion deleted successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Discussion deletion failed',
            errors: [error.message]
        };
    }
};

/**
 * Get discussion by ID with caching
 */
export const getDiscussionByIdService = async (id: string): Promise<ServiceResponse<any>> => {
    try {
        const discussion = await Discussion.findById(id)
            .populate('user', 'name avatar')
            .populate('lecture', 'title order')
            .populate('answers.user', 'name avatar')
            .lean();
            
        if (!discussion) {
            return {
                success: false,
                message: 'Discussion not found',
                errors: ['No discussion found with the provided ID']
            };
        }
        
        return {
            success: true,
            data: discussion,
            message: 'Discussion retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve discussion',
            errors: [error.message]
        };
    }
};

/**
 * Get lecture discussions (no caching)
 */
export const getLectureDiscussionsService = async (
  lectureId: string, 
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { page = 1, limit = 20, hasAnswers } = options;
        const skip = (page - 1) * limit;
        
        const query: any = { lecture: lectureId };
        if (hasAnswers !== undefined) {
            query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
        }

        const discussions = await Discussion.find(query)
            .populate('user', 'name avatar')
            .populate('answers.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Discussion.countDocuments(query);
        
        const responseData = {
            discussions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
        return {
            success: true,
            data: responseData,
            message: 'Lecture discussions retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve lecture discussions',
            errors: [error.message]
        };
    }
};

/**
 * Get course discussions (no caching)
 */
export const getCourseDiscussionsService = async (
  courseId: string, 
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { page = 1, limit = 50, hasAnswers } = options;
        const skip = (page - 1) * limit;
        
        const query: any = { course: courseId };
        if (hasAnswers !== undefined) {
            query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
        }

        const discussions = await Discussion.find(query)
            .populate('user', 'name avatar')
            .populate('lecture', 'title order')
            .populate('answers.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Discussion.countDocuments(query);
        
        const responseData = {
            discussions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
        return {
            success: true,
            data: responseData,
            message: 'Course discussions retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve course discussions',
            errors: [error.message]
        };
    }
};

/**
 * Get user discussions (no caching)
 */
export const getUserDiscussionsService = async (
  userId: string, 
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;

        const discussions = await Discussion.find({ user: userId })
            .populate('user', 'name avatar')
            .populate('lecture', 'title order')
            .populate('course', 'title thumbnail')
            .populate('answers.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Discussion.countDocuments({ user: userId });
        
        const responseData = {
            discussions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
        return {
            success: true,
            data: responseData,
            message: 'User discussions retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve user discussions',
            errors: [error.message]
        };
    }
};

/**
 * Get all discussions from user's enrolled courses
 */
export const getEnrolledCoursesDiscussionsService = async (
  userId: string, 
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;

        // Get all courses user is enrolled in
        const enrollments = await Enrollment.find({ student: userId })
          .select('course')
          .lean();
        
        const enrolledCourseIds = enrollments.map(e => e.course);
        
        console.log('🎓 Enrolled Courses for user:', {
          userId,
          enrolledCourseIds: enrolledCourseIds.filter(Boolean).map(id => id!.toString()),
          count: enrolledCourseIds.length
        });

        // Get discussions from enrolled courses
        const discussions = await Discussion.find({ 
          course: { $in: enrolledCourseIds }
        })
            .populate('user', 'name avatar')
            .populate('lecture', 'title order')
            .populate('course', 'title thumbnail')
            .populate('answers.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Discussion.countDocuments({ 
          course: { $in: enrolledCourseIds }
        });
        
        console.log('💬 Enrolled Discussions Found:', {
          count: discussions.length,
          total,
          sampleDiscussion: discussions[0] ? {
            id: discussions[0]._id,
            course: discussions[0].course,
            lecture: discussions[0].lecture,
            hasUser: !!discussions[0].user,
            hasAnswers: discussions[0].answers?.length || 0
          } : null
        });
        
        const responseData = {
            discussions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
        return {
            success: true,
            data: responseData,
            message: 'Enrolled courses discussions retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve enrolled courses discussions',
            errors: [error.message]
        };
    }
};

