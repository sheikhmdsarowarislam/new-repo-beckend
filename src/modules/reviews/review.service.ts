import mongoose from 'mongoose';
import { AppError, createError } from "../../utils/errorHandler";
import { withTransaction } from "../../utils/withTransaction";
import { invalidateCache } from "../../utils/cache";
import Review, { IReview } from "./review.model";
import Course from "../courses/course.model";
import Enrollment from "../enrollments/enrollment.model";
import { ICreateReviewBody, IUpdateReviewBody } from "./review.validation";
import { createNotification } from "../notifications/notification.service";
import { ServiceResponse } from "../../@types/api";

// --- CORE SERVICE FUNCTIONS ---

/**
 * Create a new review
 */
export const createReviewService = async (
  userId: string, 
  courseId: string, 
  rating: number, 
  comment?: string
): Promise<ServiceResponse<IReview>> => {
    try {
        const review = await withTransaction(async (session) => {
            // 1. Check if user is enrolled
            const enrollment = await Enrollment.findOne({ 
                student: userId, 
                course: courseId 
            }).session(session);
            
            if (!enrollment) {
                throw createError('Must be enrolled to review course', 400);
            }
            
            // 2. Check if already reviewed
            const existingReview = await Review.findOne({ 
                user: userId, 
                course: courseId 
            }).session(session);
            
            if (existingReview) {
                throw createError('Already reviewed this course', 400);
            }
            
            // 3. Create review
            const [review] = await Review.create([{
                user: userId,
                course: courseId,
                rating,
                comment
            }], { session, ordered: true });

            if (!review) throw createError("Failed to create review.", 500);
            
            // 4. Update course average rating
            await updateCourseRating(courseId, session);
            
            // 5. Notify instructor
            const course = await Course.findById(courseId).session(session);
            if (course) {
                await createNotification(
                    course.instructor.toString(),
                    'new_review',
                    `New ${rating}-star review received for ${course.title}`,
                    courseId
                );
            }
            
            return review.populate('user', 'name avatar');
        });

        await invalidateCache(`course:${courseId}`);
        await invalidateCache('courses:list');

        return {
            success: true,
            data: review,
            message: 'Review created successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Review creation failed',
            errors: [error.message]
        };
    }
};

/**
 * Update review
 */
export const updateReviewService = async (
  reviewId: string, 
  userId: string, 
  rating?: number, 
  comment?: string
): Promise<ServiceResponse<IReview>> => {
    try {
        const review = await withTransaction(async (session) => {
            const review = await Review.findOne({ _id: reviewId, user: userId }).session(session);
            if (!review) throw new AppError('Review not found or unauthorized', 404);
            
            // Update fields
            if (rating !== undefined) review.rating = rating;
            if (comment !== undefined) review.comment = comment;
            
            await review.save({ session });
            
            // Update course rating
            await updateCourseRating(review.course.toString(), session);
            
            return review.populate('user', 'name avatar');
        });

        await invalidateCache(`course:${review.course.toString()}`);
        await invalidateCache('courses:list');

        return {
            success: true,
            data: review,
            message: 'Review updated successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Review update failed',
            errors: [error.message]
        };
    }
};

/**
 * Delete review
 */
export const deleteReviewService = async (reviewId: string, userId: string): Promise<ServiceResponse<any>> => {
    try {
        let courseId: string = '';
        
        await withTransaction(async (session) => {
            const review = await Review.findOneAndDelete({ _id: reviewId, user: userId }, { session });
            if (!review) throw new AppError('Review not found or unauthorized', 404);
            
            courseId = review.course.toString();
            
            // Update course rating
            await updateCourseRating(courseId, session);
            
        });

        await invalidateCache(`course:${courseId}`);
        await invalidateCache('courses:list');

        return {
            success: true,
            data: undefined,
            message: 'Review deleted successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Review deletion failed',
            errors: [error.message]
        };
    }
};

/**
 * Get review by ID
 */
export const getReviewByIdService = async (id: string): Promise<ServiceResponse<any>> => {
    try {
        const review = await Review.findById(id)
            .populate('user', 'name avatar')
            .populate('course', 'title thumbnail')
            .lean();
            
        if (!review) {
            return {
                success: false,
                message: 'Review not found',
                errors: ['No review found with the provided ID']
            };
        }
        
        return {
            success: true,
            data: { review },
            message: 'Review retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve review',
            errors: [error.message]
        };
    }
};

/**
 * Get course reviews
 */
export const getCourseReviewsService = async (
  courseId: string, 
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        const skip = (page - 1) * limit;
        
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const reviews = await Review.find({ course: courseId })
            .populate('user', 'name avatar')
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Review.countDocuments({ course: courseId });
        
        const responseData = {
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
        console.log(`📊 Fetched ${reviews.length} reviews for course ${courseId}`);
        
        return {
            success: true,
            data: responseData,
            message: 'Course reviews retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve course reviews',
            errors: [error.message]
        };
    }
};

/**
 * Get user reviews
 */
export const getUserReviewsService = async (
  userId: string, 
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ user: userId })
            .populate('course', 'title thumbnail instructor')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Review.countDocuments({ user: userId });
        
        const responseData = {
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
        console.log(`📊 Fetched ${reviews.length} reviews for user ${userId}`);
        
        return {
            success: true,
            data: responseData,
            message: 'User reviews retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve user reviews',
            errors: [error.message]
        };
    }
};

/**
 * Get course review statistics
 */
export const getCourseReviewStatsService = async (courseId: string): Promise<ServiceResponse<any>> => {
    try {
        const reviews = await Review.find({ course: courseId }).lean();
        
        if (reviews.length === 0) {
            const stats = {
                totalReviews: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
            const responseData = { stats };
            
            return {
                success: true,
                data: responseData,
                message: 'Review stats retrieved successfully'
            };
        }
        
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        const ratingDistribution = reviews.reduce((acc, review) => {
            acc[review.rating] = (acc[review.rating] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        
        // Ensure all rating levels are present
        for (let i = 1; i <= 5; i++) {
            if (!ratingDistribution[i]) ratingDistribution[i] = 0;
        }
        
        const stats = {
            totalReviews: reviews.length,
            averageRating: Math.round(averageRating * 10) / 10,
            ratingDistribution
        };
        
        const responseData = { stats };
        
        return {
            success: true,
            data: responseData,
            message: 'Review stats retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve review stats',
            errors: [error.message]
        };
    }
};

/**
 * Update course rating (internal helper) - OPTIMIZED
 */
const updateCourseRating = async (courseId: string, session?: mongoose.ClientSession): Promise<void> => {
  // OPTIMIZATION: Use aggregation for better performance
  const stats = await Review.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: { $ifNull: ["$rating", 0] } }
      }
    }
  ]).session(session || null);
  
  if (stats.length === 0) {
    await Course.findByIdAndUpdate(courseId, {
      averageRating: 0,
      reviewCount: 0
    }, { session });
    return;
  }
  
  const { totalReviews, averageRating } = stats[0];
  
  await Course.findByIdAndUpdate(courseId, {
    averageRating: Math.round(averageRating * 10) / 10,
    reviewCount: totalReviews
  }, { session });
};


/**
 * Get all reviews for instructor's courses
 */
export const getInstructorReviewsService = async (instructorId: string): Promise<ServiceResponse<any>> => {
  try {
    // Get all courses by this instructor
    const instructorCourses = await Course.find({ instructor: instructorId }).select('_id').lean();
    const courseIds = instructorCourses.map(c => c._id);

    if (courseIds.length === 0) {
      return {
        success: true,
        data: {
          reviews: [],
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        },
        message: 'No reviews found'
      };
    }

    // Aggregate reviews with course and user details
    const reviews = await Review.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData',
          pipeline: [
            { $project: { name: 1, avatar: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseData',
          pipeline: [
            { $project: { title: 1, thumbnail: 1 } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          comment: 1,
          createdAt: 1,
          updatedAt: 1,
          user: { $arrayElemAt: ['$userData', 0] },
          course: { $arrayElemAt: ['$courseData', 0] }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Calculate statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      if (review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      }
    });

    return {
      success: true,
      data: {
        reviews,
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution
      },
      message: 'Instructor reviews retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve instructor reviews',
      errors: [error.message]
    };
  }
};