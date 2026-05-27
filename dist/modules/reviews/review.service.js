"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructorReviewsService = exports.getCourseReviewStatsService = exports.getUserReviewsService = exports.getCourseReviewsService = exports.getReviewByIdService = exports.deleteReviewService = exports.updateReviewService = exports.createReviewService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const errorHandler_1 = require("../../utils/errorHandler");
const withTransaction_1 = require("../../utils/withTransaction");
const cache_1 = require("../../utils/cache");
const review_model_1 = __importDefault(require("./review.model"));
const course_model_1 = __importDefault(require("../courses/course.model"));
const enrollment_model_1 = __importDefault(require("../enrollments/enrollment.model"));
const notification_service_1 = require("../notifications/notification.service");
// --- CORE SERVICE FUNCTIONS ---
/**
 * Create a new review
 */
const createReviewService = async (userId, courseId, rating, comment) => {
    try {
        const review = await (0, withTransaction_1.withTransaction)(async (session) => {
            // 1. Check if user is enrolled
            const enrollment = await enrollment_model_1.default.findOne({
                student: userId,
                course: courseId
            }).session(session);
            if (!enrollment) {
                throw (0, errorHandler_1.createError)('Must be enrolled to review course', 400);
            }
            // 2. Check if already reviewed
            const existingReview = await review_model_1.default.findOne({
                user: userId,
                course: courseId
            }).session(session);
            if (existingReview) {
                throw (0, errorHandler_1.createError)('Already reviewed this course', 400);
            }
            // 3. Create review
            const [review] = await review_model_1.default.create([{
                    user: userId,
                    course: courseId,
                    rating,
                    comment
                }], { session, ordered: true });
            if (!review)
                throw (0, errorHandler_1.createError)("Failed to create review.", 500);
            // 4. Update course average rating
            await updateCourseRating(courseId, session);
            // 5. Notify instructor
            const course = await course_model_1.default.findById(courseId).session(session);
            if (course) {
                await (0, notification_service_1.createNotification)(course.instructor.toString(), 'new_review', `New ${rating}-star review received for ${course.title}`, courseId);
            }
            return review.populate('user', 'name avatar');
        });
        await (0, cache_1.invalidateCache)(`course:${courseId}`);
        await (0, cache_1.invalidateCache)('courses:list');
        return {
            success: true,
            data: review,
            message: 'Review created successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Review creation failed',
            errors: [error.message]
        };
    }
};
exports.createReviewService = createReviewService;
/**
 * Update review
 */
const updateReviewService = async (reviewId, userId, rating, comment) => {
    try {
        const review = await (0, withTransaction_1.withTransaction)(async (session) => {
            const review = await review_model_1.default.findOne({ _id: reviewId, user: userId }).session(session);
            if (!review)
                throw new errorHandler_1.AppError('Review not found or unauthorized', 404);
            // Update fields
            if (rating !== undefined)
                review.rating = rating;
            if (comment !== undefined)
                review.comment = comment;
            await review.save({ session });
            // Update course rating
            await updateCourseRating(review.course.toString(), session);
            return review.populate('user', 'name avatar');
        });
        await (0, cache_1.invalidateCache)(`course:${review.course.toString()}`);
        await (0, cache_1.invalidateCache)('courses:list');
        return {
            success: true,
            data: review,
            message: 'Review updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Review update failed',
            errors: [error.message]
        };
    }
};
exports.updateReviewService = updateReviewService;
/**
 * Delete review
 */
const deleteReviewService = async (reviewId, userId) => {
    try {
        let courseId = '';
        await (0, withTransaction_1.withTransaction)(async (session) => {
            const review = await review_model_1.default.findOneAndDelete({ _id: reviewId, user: userId }, { session });
            if (!review)
                throw new errorHandler_1.AppError('Review not found or unauthorized', 404);
            courseId = review.course.toString();
            // Update course rating
            await updateCourseRating(courseId, session);
        });
        await (0, cache_1.invalidateCache)(`course:${courseId}`);
        await (0, cache_1.invalidateCache)('courses:list');
        return {
            success: true,
            data: undefined,
            message: 'Review deleted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Review deletion failed',
            errors: [error.message]
        };
    }
};
exports.deleteReviewService = deleteReviewService;
/**
 * Get review by ID
 */
const getReviewByIdService = async (id) => {
    try {
        const review = await review_model_1.default.findById(id)
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve review',
            errors: [error.message]
        };
    }
};
exports.getReviewByIdService = getReviewByIdService;
/**
 * Get course reviews
 */
const getCourseReviewsService = async (courseId, options = {}) => {
    try {
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        const skip = (page - 1) * limit;
        const sortObj = {};
        sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const reviews = await review_model_1.default.find({ course: courseId })
            .populate('user', 'name avatar')
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await review_model_1.default.countDocuments({ course: courseId });
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve course reviews',
            errors: [error.message]
        };
    }
};
exports.getCourseReviewsService = getCourseReviewsService;
/**
 * Get user reviews
 */
const getUserReviewsService = async (userId, options = {}) => {
    try {
        const { page = 1, limit = 10 } = options;
        const skip = (page - 1) * limit;
        const reviews = await review_model_1.default.find({ user: userId })
            .populate('course', 'title thumbnail instructor')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await review_model_1.default.countDocuments({ user: userId });
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve user reviews',
            errors: [error.message]
        };
    }
};
exports.getUserReviewsService = getUserReviewsService;
/**
 * Get course review statistics
 */
const getCourseReviewStatsService = async (courseId) => {
    try {
        const reviews = await review_model_1.default.find({ course: courseId }).lean();
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
        }, {});
        // Ensure all rating levels are present
        for (let i = 1; i <= 5; i++) {
            if (!ratingDistribution[i])
                ratingDistribution[i] = 0;
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve review stats',
            errors: [error.message]
        };
    }
};
exports.getCourseReviewStatsService = getCourseReviewStatsService;
/**
 * Update course rating (internal helper) - OPTIMIZED
 */
const updateCourseRating = async (courseId, session) => {
    // OPTIMIZATION: Use aggregation for better performance
    const stats = await review_model_1.default.aggregate([
        { $match: { course: new mongoose_1.default.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: null,
                totalReviews: { $sum: 1 },
                averageRating: { $avg: { $ifNull: ["$rating", 0] } }
            }
        }
    ]).session(session || null);
    if (stats.length === 0) {
        await course_model_1.default.findByIdAndUpdate(courseId, {
            averageRating: 0,
            reviewCount: 0
        }, { session });
        return;
    }
    const { totalReviews, averageRating } = stats[0];
    await course_model_1.default.findByIdAndUpdate(courseId, {
        averageRating: Math.round(averageRating * 10) / 10,
        reviewCount: totalReviews
    }, { session });
};
/**
 * Get all reviews for instructor's courses
 */
const getInstructorReviewsService = async (instructorId) => {
    try {
        // Get all courses by this instructor
        const instructorCourses = await course_model_1.default.find({ instructor: instructorId }).select('_id').lean();
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
        const reviews = await review_model_1.default.aggregate([
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
                ratingDistribution[review.rating]++;
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve instructor reviews',
            errors: [error.message]
        };
    }
};
exports.getInstructorReviewsService = getInstructorReviewsService;
//# sourceMappingURL=review.service.js.map