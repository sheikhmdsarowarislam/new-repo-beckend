"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnrolledCoursesDiscussionsService = exports.getUserDiscussionsService = exports.getCourseDiscussionsService = exports.getLectureDiscussionsService = exports.getDiscussionByIdService = exports.deleteDiscussionService = exports.updateDiscussionService = exports.answerQuestionService = exports.createDiscussionService = void 0;
const errorHandler_1 = require("../../utils/errorHandler");
const withTransaction_1 = require("../../utils/withTransaction");
const cache_1 = require("../../utils/cache");
const discussion_model_1 = __importDefault(require("./discussion.model"));
const lecture_model_1 = __importDefault(require("../lectures/lecture.model"));
const course_model_1 = __importDefault(require("../courses/course.model"));
const enrollment_model_1 = __importDefault(require("../enrollments/enrollment.model"));
const notification_service_1 = require("../notifications/notification.service");
// --- CORE SERVICE FUNCTIONS ---
/**
 * Create discussion
 */
const createDiscussionService = async (userId, lectureId, question) => {
    try {
        const discussion = await (0, withTransaction_1.withTransaction)(async (session) => {
            // OPTIMIZATION: Use lean queries for better performance
            const lecture = await lecture_model_1.default.findById(lectureId).lean().session(session);
            if (!lecture)
                throw (0, errorHandler_1.createError)('Lecture not found', 404);
            const enrollment = await enrollment_model_1.default.findOne({
                student: userId,
                course: lecture.course
            }).lean().session(session);
            if (!enrollment) {
                throw (0, errorHandler_1.createError)('Must be enrolled in the course to create discussions', 403);
            }
            const [discussion] = await discussion_model_1.default.create([{
                    user: userId,
                    lecture: lectureId,
                    course: lecture.course,
                    question,
                    answers: []
                }], { session, ordered: true });
            if (!discussion)
                throw (0, errorHandler_1.createError)("Failed to create discussion.", 500);
            // OPTIMIZATION: Use lean query for course lookup
            const course = await course_model_1.default.findById(lecture.course).lean().session(session);
            if (course) {
                await (0, notification_service_1.createNotification)(course.instructor.toString(), 'new_question', `New question in ${lecture.title}`, discussion._id.toString());
            }
            return discussion.populate('user', 'name avatar');
        });
        await (0, cache_1.invalidateCache)(`discussions:${lectureId}`);
        return {
            success: true,
            data: discussion,
            message: 'Discussion created successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Discussion creation failed',
            errors: [error.message]
        };
    }
};
exports.createDiscussionService = createDiscussionService;
/**
 * Answer question
 */
const answerQuestionService = async (discussionId, userId, text, isInstructor = false) => {
    try {
        const discussion = await (0, withTransaction_1.withTransaction)(async (session) => {
            const discussion = await discussion_model_1.default.findById(discussionId).session(session);
            if (!discussion)
                throw (0, errorHandler_1.createError)('Discussion not found', 404);
            // OPTIMIZATION: Use lean query for enrollment check
            if (!isInstructor) {
                const enrollment = await enrollment_model_1.default.findOne({
                    student: userId,
                    course: discussion.course
                }).lean().session(session);
                if (!enrollment) {
                    throw (0, errorHandler_1.createError)('Must be enrolled in the course to answer discussions', 403);
                }
            }
            discussion.answers.push({
                user: userId,
                text,
                isInstructorAnswer: isInstructor
            });
            await discussion.save({ session });
            // Notify question asker if different from answerer
            if (discussion.user.toString() !== userId) {
                await (0, notification_service_1.createNotification)(discussion.user.toString(), 'question_answered', `Your question has been answered`, discussionId);
            }
            return discussion.populate([
                { path: 'user', select: 'name avatar' },
                { path: 'answers.user', select: 'name avatar' }
            ]);
        });
        await (0, cache_1.invalidateCache)(`discussions:${discussion.lecture.toString()}`);
        return {
            success: true,
            data: discussion,
            message: 'Answer submitted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Answer submission failed',
            errors: [error.message]
        };
    }
};
exports.answerQuestionService = answerQuestionService;
/**
 * Update discussion
 */
const updateDiscussionService = async (discussionId, userId, question, userRole) => {
    try {
        const discussion = await (0, withTransaction_1.withTransaction)(async (session) => {
            const discussion = await discussion_model_1.default.findById(discussionId).session(session);
            if (!discussion)
                throw (0, errorHandler_1.createError)('Discussion not found', 404);
            // Check permissions: original poster, course instructor, or admin
            const isOriginalPoster = discussion.user.toString() === userId;
            const isAdmin = userRole === 'admin';
            let isCourseInstructor = false;
            if (!isOriginalPoster && !isAdmin) {
                // OPTIMIZATION: Use lean query for course instructor check
                const course = await course_model_1.default.findById(discussion.course).lean().session(session);
                if (course && course.instructor.toString() === userId) {
                    isCourseInstructor = true;
                }
            }
            if (!isOriginalPoster && !isAdmin && !isCourseInstructor) {
                throw (0, errorHandler_1.createError)('Unauthorized: Only the original poster, course instructor, or admin can update discussions', 403);
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Discussion update failed',
            errors: [error.message]
        };
    }
};
exports.updateDiscussionService = updateDiscussionService;
/**
 * Delete discussion
 */
const deleteDiscussionService = async (discussionId, userId, userRole) => {
    try {
        await (0, withTransaction_1.withTransaction)(async (session) => {
            const discussion = await discussion_model_1.default.findById(discussionId).session(session);
            if (!discussion)
                throw (0, errorHandler_1.createError)('Discussion not found', 404);
            // Check permissions: original poster, course instructor, or admin
            const isOriginalPoster = discussion.user.toString() === userId;
            const isAdmin = userRole === 'admin';
            let isCourseInstructor = false;
            if (!isOriginalPoster && !isAdmin) {
                // OPTIMIZATION: Use lean query for course instructor check
                const course = await course_model_1.default.findById(discussion.course).lean().session(session);
                if (course && course.instructor.toString() === userId) {
                    isCourseInstructor = true;
                }
            }
            if (!isOriginalPoster && !isAdmin && !isCourseInstructor) {
                throw (0, errorHandler_1.createError)('Unauthorized: Only the original poster, course instructor, or admin can delete discussions', 403);
            }
            // Delete the discussion
            await discussion_model_1.default.findByIdAndDelete(discussionId).session(session);
        });
        return {
            success: true,
            data: undefined,
            message: 'Discussion deleted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Discussion deletion failed',
            errors: [error.message]
        };
    }
};
exports.deleteDiscussionService = deleteDiscussionService;
/**
 * Get discussion by ID with caching
 */
const getDiscussionByIdService = async (id) => {
    try {
        const discussion = await discussion_model_1.default.findById(id)
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve discussion',
            errors: [error.message]
        };
    }
};
exports.getDiscussionByIdService = getDiscussionByIdService;
/**
 * Get lecture discussions (no caching)
 */
const getLectureDiscussionsService = async (lectureId, options = {}) => {
    try {
        const { page = 1, limit = 20, hasAnswers } = options;
        const skip = (page - 1) * limit;
        const query = { lecture: lectureId };
        if (hasAnswers !== undefined) {
            query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
        }
        const discussions = await discussion_model_1.default.find(query)
            .populate('user', 'name avatar')
            .populate('answers.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await discussion_model_1.default.countDocuments(query);
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve lecture discussions',
            errors: [error.message]
        };
    }
};
exports.getLectureDiscussionsService = getLectureDiscussionsService;
/**
 * Get course discussions (no caching)
 */
const getCourseDiscussionsService = async (courseId, options = {}) => {
    try {
        const { page = 1, limit = 50, hasAnswers } = options;
        const skip = (page - 1) * limit;
        const query = { course: courseId };
        if (hasAnswers !== undefined) {
            query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
        }
        const discussions = await discussion_model_1.default.find(query)
            .populate('user', 'name avatar')
            .populate('lecture', 'title order')
            .populate('answers.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await discussion_model_1.default.countDocuments(query);
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve course discussions',
            errors: [error.message]
        };
    }
};
exports.getCourseDiscussionsService = getCourseDiscussionsService;
/**
 * Get user discussions (no caching)
 */
const getUserDiscussionsService = async (userId, options = {}) => {
    try {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        const discussions = await discussion_model_1.default.find({ user: userId })
            .populate('user', 'name avatar')
            .populate('lecture', 'title order')
            .populate('course', 'title thumbnail')
            .populate('answers.user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await discussion_model_1.default.countDocuments({ user: userId });
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve user discussions',
            errors: [error.message]
        };
    }
};
exports.getUserDiscussionsService = getUserDiscussionsService;
/**
 * Get all discussions from user's enrolled courses
 */
const getEnrolledCoursesDiscussionsService = async (userId, options = {}) => {
    try {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        // Get all courses user is enrolled in
        const enrollments = await enrollment_model_1.default.find({ student: userId })
            .select('course')
            .lean();
        const enrolledCourseIds = enrollments.map(e => e.course);
        console.log('🎓 Enrolled Courses for user:', {
            userId,
            enrolledCourseIds: enrolledCourseIds.filter(Boolean).map(id => id.toString()),
            count: enrolledCourseIds.length
        });
        // Get discussions from enrolled courses
        const discussions = await discussion_model_1.default.find({
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
        const total = await discussion_model_1.default.countDocuments({
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve enrolled courses discussions',
            errors: [error.message]
        };
    }
};
exports.getEnrolledCoursesDiscussionsService = getEnrolledCoursesDiscussionsService;
//# sourceMappingURL=discussion.service.js.map