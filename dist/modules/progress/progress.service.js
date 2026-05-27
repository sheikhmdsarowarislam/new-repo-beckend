"use strict";
// src/modules/progress/progress.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseCompletionStats = exports.updateQuizProgress = exports.generateCertificate = exports.getUserDashboard = exports.getCourseProgressService = exports.updateLectureProgress = void 0;
const errorHandler_1 = require("../../utils/errorHandler");
const progress_model_1 = __importDefault(require("./progress.model"));
const lecture_model_1 = __importDefault(require("../lectures/lecture.model"));
const course_model_1 = __importDefault(require("../courses/course.model"));
const enrollment_model_1 = __importDefault(require("../enrollments/enrollment.model"));
const certificate_model_1 = __importDefault(require("../certificates/certificate.model"));
const user_model_1 = __importDefault(require("../users/user.model"));
const quiz_model_1 = __importDefault(require("../quizes/quiz.model"));
const notification_service_1 = require("../notifications/notification.service");
const email_1 = require("../../utils/email");
const cache_1 = require("../../utils/cache");
const PROGRESS_CACHE_BASE = 'progress';
// Update lecture progress
const updateLectureProgress = async (userId, lectureId, progressPercentage) => {
    try {
        const lecture = await lecture_model_1.default.findById(lectureId);
        if (!lecture)
            throw (0, errorHandler_1.createError)('Lecture not found', 404);
        // Check if user is enrolled
        const enrollment = await enrollment_model_1.default.findOne({ student: userId, course: lecture.course });
        if (!enrollment)
            throw (0, errorHandler_1.createError)('Not enrolled in this course', 400);
        let courseProgress = await progress_model_1.default.findOne({ user: userId, course: lecture.course });
        if (!courseProgress) {
            courseProgress = new progress_model_1.default({
                user: userId,
                course: lecture.course,
                completedLectures: new Map(),
                totalLecturesCompleted: 0,
                quizzesCompleted: false,
                averageQuizScore: 0,
                isCourseCompleted: false
            });
        }
        // Mark as completed if 80% watched
        if (progressPercentage >= 0.8) {
            const lectureKey = lectureId.toString();
            if (!courseProgress.completedLectures.get(lectureKey)) {
                courseProgress.completedLectures.set(lectureKey, true);
                courseProgress.totalLecturesCompleted += 1;
                courseProgress.lastViewedLecture = lectureId;
            }
        }
        // Check if course is completed (both lectures AND quizzes)
        const totalLectures = await lecture_model_1.default.countDocuments({ course: lecture.course });
        const totalQuizzes = await quiz_model_1.default.countDocuments({ course: lecture.course });
        const allLecturesCompleted = courseProgress.totalLecturesCompleted >= totalLectures;
        const allQuizzesCompleted = courseProgress.totalQuizzesCompleted >= totalQuizzes;
        const wasCourseCompleted = courseProgress.isCourseCompleted;
        if (allLecturesCompleted && allQuizzesCompleted && !wasCourseCompleted) {
            courseProgress.isCourseCompleted = true;
            // Generate certificate when course is completed
            await (0, exports.generateCertificate)(userId, lecture.course.toString());
        }
        await courseProgress.save();
        return {
            success: true,
            data: courseProgress,
            message: 'Lecture progress updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Lecture progress update failed',
            errors: [error.message]
        };
    }
};
exports.updateLectureProgress = updateLectureProgress;
// Get detailed course progress - OPTIMIZED
const getCourseProgressService = async (userId, courseId) => {
    try {
        // ✅ OPTIMIZED: Single query with all needed data
        const [progress, courseCounts] = await Promise.all([
            progress_model_1.default.findOne({ user: userId, course: courseId })
                .populate('course', 'title thumbnail')
                .populate('lastViewedLecture', 'title order'),
            // Get counts in parallel
            Promise.all([
                lecture_model_1.default.countDocuments({ course: courseId }),
                quiz_model_1.default.countDocuments({ course: courseId })
            ])
        ]);
        if (!progress) {
            return {
                success: false,
                message: 'No progress found for this course',
                errors: ['No progress record found for the specified course']
            };
        }
        const [totalLectures, totalQuizzes] = courseCounts;
        const totalItems = totalLectures + totalQuizzes;
        const completedItems = (progress.totalLecturesCompleted || 0) + (progress.totalQuizzesCompleted || 0);
        const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        // ✅ OPTIMIZED: Convert Maps to objects efficiently
        const completedLecturesObj = progress.completedLectures ?
            Object.fromEntries(progress.completedLectures) : {};
        const completedQuizzesObj = progress.completedQuizzes ?
            Object.fromEntries(progress.completedQuizzes) : {};
        const responseData = {
            ...progress.toObject(),
            completedLectures: completedLecturesObj,
            completedQuizzes: completedQuizzesObj,
            completionPercentage: Math.round(completionPercentage),
            totalLectures,
            totalQuizzes,
            remainingLectures: totalLectures - progress.totalLecturesCompleted,
            remainingQuizzes: totalQuizzes - (progress.totalQuizzesCompleted || 0)
        };
        return {
            success: true,
            data: responseData,
            message: 'Course progress retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve course progress',
            errors: [error.message]
        };
    }
};
exports.getCourseProgressService = getCourseProgressService;
// Get user's learning dashboard - OPTIMIZED
const getUserDashboard = async (userId) => {
    try {
        // ✅ OPTIMIZATION: Start with enrollments to show ALL enrolled courses
        const enrollments = await enrollment_model_1.default.find({ student: userId })
            .populate('course', 'title thumbnail category level averageRating')
            .sort({ enrollmentDate: -1 })
            .lean();
        if (enrollments.length === 0) {
            return {
                success: true,
                data: {
                    totalEnrollments: 0,
                    completedCourses: 0,
                    inProgressCourses: 0,
                    courses: []
                },
                message: 'No enrollments found'
            };
        }
        // Get all course IDs - extract _id from populated course objects
        const courseIds = enrollments.map(e => {
            const course = e.course;
            return course._id || course;
        });
        // Get progress data for all enrolled courses
        const progressRecords = await progress_model_1.default.find({
            user: userId,
            course: { $in: courseIds }
        })
            .populate('lastViewedLecture', 'title order')
            .lean();
        // Create a map for quick lookup
        const progressMap = new Map();
        progressRecords.forEach(p => {
            progressMap.set(p.course.toString(), p);
        });
        // Get lecture and quiz counts for each course
        const courseCountsPromises = courseIds.map(async (courseId) => {
            const [lectureCount, quizCount] = await Promise.all([
                lecture_model_1.default.countDocuments({ course: courseId }),
                quiz_model_1.default.countDocuments({ course: courseId })
            ]);
            return {
                courseId: courseId.toString(),
                totalLectures: lectureCount,
                totalQuizzes: quizCount
            };
        });
        const courseCounts = await Promise.all(courseCountsPromises);
        const courseCountsMap = new Map();
        courseCounts.forEach(cc => {
            courseCountsMap.set(cc.courseId, cc);
        });
        // ✅ OPTIMIZATION: Calculate progress for each enrollment with accurate data
        const dashboardData = enrollments.map(enrollment => {
            const course = enrollment.course;
            const progress = progressMap.get(course._id.toString());
            const counts = courseCountsMap.get(course._id.toString());
            // Debug logging for troubleshooting
            console.log(`📊 Progress for course ${course.title}:`, {
                courseId: course._id.toString(),
                hasProgress: !!progress,
                progressData: progress ? {
                    totalLecturesCompleted: progress.totalLecturesCompleted,
                    totalQuizzesCompleted: progress.totalQuizzesCompleted,
                    isCourseCompleted: progress.isCourseCompleted,
                    completedLectures: progress.completedLectures,
                    completedQuizzes: progress.completedQuizzes
                } : null,
                counts
            });
            // Get completed counts - with fallback to calculate from Maps if counters are wrong
            let totalLecturesCompleted = progress?.totalLecturesCompleted || 0;
            let totalQuizzesCompleted = progress?.totalQuizzesCompleted || 0;
            // FALLBACK: If counters are 0 but Maps have data, recalculate
            if (totalLecturesCompleted === 0 && progress?.completedLectures) {
                if (typeof progress.completedLectures === 'object') {
                    if ('size' in progress.completedLectures) {
                        totalLecturesCompleted = progress.completedLectures.size;
                    }
                    else {
                        totalLecturesCompleted = Object.keys(progress.completedLectures).filter(key => progress.completedLectures[key] === true).length;
                    }
                }
            }
            if (totalQuizzesCompleted === 0 && progress?.completedQuizzes) {
                if (typeof progress.completedQuizzes === 'object') {
                    if ('size' in progress.completedQuizzes) {
                        totalQuizzesCompleted = progress.completedQuizzes.size;
                    }
                    else {
                        totalQuizzesCompleted = Object.keys(progress.completedQuizzes).filter(key => progress.completedQuizzes[key]?.completed === true).length;
                    }
                }
            }
            const totalLectures = counts?.totalLectures || 0;
            const totalQuizzes = counts?.totalQuizzes || 0;
            const totalItems = totalLectures + totalQuizzes;
            const completedItems = totalLecturesCompleted + totalQuizzesCompleted;
            console.log(`🔄 After fallback calculation for ${course.title}:`, {
                totalLecturesCompleted,
                totalQuizzesCompleted,
                completedItems,
                totalItems
            });
            // Calculate ACCURATE completion percentage
            const completionPercentage = totalItems > 0
                ? Math.round((completedItems / totalItems) * 100)
                : 0;
            // Calculate reward points
            const lecturePoints = totalLecturesCompleted * 10;
            const quizPoints = totalQuizzesCompleted * 20;
            const completionBonus = progress?.isCourseCompleted ? 50 : 0;
            const totalRewardPoints = lecturePoints + quizPoints + completionBonus;
            return {
                course: {
                    _id: course._id,
                    title: course.title,
                    thumbnail: course.thumbnail,
                    category: course.category,
                    level: course.level,
                    averageRating: course.averageRating
                },
                progress: completionPercentage,
                isCompleted: progress?.isCourseCompleted || false,
                lastViewed: progress?.lastViewedLecture || null,
                totalLectures,
                totalQuizzes,
                totalLecturesCompleted,
                totalQuizzesCompleted,
                totalItems,
                completedItems,
                averageQuizScore: progress?.averageQuizScore || 0,
                rewardPoints: {
                    lecturePoints,
                    quizPoints,
                    completionBonus,
                    totalPoints: totalRewardPoints
                }
            };
        });
        const completedCourses = dashboardData.filter(p => p.isCompleted).length;
        const inProgressCourses = dashboardData.filter(p => !p.isCompleted && p.progress > 0).length;
        // Calculate total reward points across all courses
        const totalRewardPoints = dashboardData.reduce((sum, course) => sum + course.rewardPoints.totalPoints, 0);
        const result = {
            totalEnrollments: dashboardData.length,
            completedCourses,
            inProgressCourses,
            totalRewardPoints,
            courses: dashboardData
        };
        return {
            success: true,
            data: result,
            message: 'Dashboard retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve dashboard',
            errors: [error.message]
        };
    }
};
exports.getUserDashboard = getUserDashboard;
// Generate certificate when course is completed
const generateCertificate = async (userId, courseId) => {
    try {
        // OPTIMIZATION: Use lean queries for better performance
        const [course, user] = await Promise.all([
            course_model_1.default.findById(courseId).lean(),
            user_model_1.default.findById(userId).lean()
        ]);
        if (!course || !user) {
            return {
                success: false,
                message: 'Course or user not found',
                errors: ['Invalid course or user ID']
            };
        }
        // Check if certificate already exists
        const existingCertificate = await certificate_model_1.default.findOne({ user: userId, course: courseId });
        if (existingCertificate) {
            // If a certificate exists, resend email/notification to ensure the user is informed
            try {
                await (0, email_1.sendEmail)(user.email, `🏆 Certificate Earned - CodeTutor LMS`, 'certificate-completion', {
                    studentName: user.name,
                    courseTitle: course.title,
                    completionDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    certificateId: existingCertificate.certificateId,
                    certificateUrl: existingCertificate.downloadUrl
                });
            }
            catch (error) {
                console.error('Failed to send existing certificate email:', error);
            }
            // Send in-app notification as well
            await (0, notification_service_1.createNotification)(userId, 'certificate_earned', `Congratulations! You've earned a certificate for completing ${course.title}`, courseId);
            return {
                success: true,
                data: existingCertificate,
                message: 'Certificate already exists. Email and notification sent.'
            };
        }
        // Generate unique certificate ID
        const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Create certificate
        const certificate = new certificate_model_1.default({
            user: userId,
            course: courseId,
            certificateId,
            downloadUrl: `${process.env.BACKEND_URL || 'https://lms-backend-xyz.vercel.app'}/api/v1/certificates/download/${certificateId}`
        });
        await certificate.save();
        await (0, cache_1.invalidateCache)(`certificate:${userId}:${courseId}`);
        // Send email notification
        try {
            await (0, email_1.sendEmail)(user.email, `🏆 Certificate Earned - CodeTutor LMS`, 'certificate-completion', {
                studentName: user.name,
                courseTitle: course.title,
                completionDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                certificateId: certificateId,
                certificateUrl: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/certificates/download/${certificateId}`
            });
        }
        catch (error) {
            console.error('Failed to send certificate completion email:', error);
        }
        // Send in-app notification
        await (0, notification_service_1.createNotification)(userId, 'certificate_earned', `Congratulations! You've earned a certificate for completing ${course.title}`, courseId);
        return {
            success: true,
            data: certificate,
            message: 'Certificate generated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Certificate generation failed',
            errors: [error.message]
        };
    }
};
exports.generateCertificate = generateCertificate;
// Update quiz progress when quiz is completed
const updateQuizProgress = async (userId, quizId, score, courseId) => {
    try {
        // Check if user is enrolled
        const enrollment = await enrollment_model_1.default.findOne({ student: userId, course: courseId });
        if (!enrollment) {
            return {
                success: false,
                message: 'User not enrolled in this course',
                errors: ['Not enrolled in this course']
            };
        }
        let courseProgress = await progress_model_1.default.findOne({ user: userId, course: courseId });
        if (!courseProgress) {
            courseProgress = new progress_model_1.default({
                user: userId,
                course: courseId,
                completedLectures: new Map(),
                completedQuizzes: new Map(),
                totalLecturesCompleted: 0,
                totalQuizzesCompleted: 0,
                quizzesCompleted: false,
                averageQuizScore: 0,
                isCourseCompleted: false
            });
        }
        // Update quiz completion
        const quizKey = quizId.toString();
        const existingQuiz = courseProgress.completedQuizzes.get(quizKey);
        // Only update if this is a new completion or better score
        if (!existingQuiz || score > existingQuiz.score) {
            courseProgress.completedQuizzes.set(quizKey, {
                completed: true,
                score: score,
                completedAt: new Date()
            });
            // Recalculate total quizzes completed and average score
            let totalScore = 0;
            let completedCount = 0;
            courseProgress.completedQuizzes.forEach((quizData) => {
                if (quizData.completed) {
                    totalScore += quizData.score;
                    completedCount++;
                }
            });
            courseProgress.totalQuizzesCompleted = completedCount;
            courseProgress.averageQuizScore = completedCount > 0 ? totalScore / completedCount : 0;
        }
        // Check if course is completed (both lectures AND quizzes)
        const totalLectures = await lecture_model_1.default.countDocuments({ course: courseId });
        const totalQuizzes = await quiz_model_1.default.countDocuments({ course: courseId });
        const allLecturesCompleted = courseProgress.totalLecturesCompleted >= totalLectures;
        const allQuizzesCompleted = courseProgress.totalQuizzesCompleted >= totalQuizzes;
        const wasCourseCompleted = courseProgress.isCourseCompleted;
        if (allLecturesCompleted && allQuizzesCompleted && !wasCourseCompleted) {
            courseProgress.isCourseCompleted = true;
            // Generate certificate when course is completed
            await (0, exports.generateCertificate)(userId, courseId);
        }
        await courseProgress.save();
        return {
            success: true,
            data: courseProgress,
            message: 'Quiz progress updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Quiz progress update failed',
            errors: [error.message]
        };
    }
};
exports.updateQuizProgress = updateQuizProgress;
// Get course completion statistics - OPTIMIZED
const getCourseCompletionStats = async (courseId) => {
    try {
        // OPTIMIZATION: Use parallel queries for better performance
        const [totalEnrollments, completedProgress] = await Promise.all([
            enrollment_model_1.default.countDocuments({ course: courseId }),
            progress_model_1.default.countDocuments({
                course: courseId,
                isCourseCompleted: true
            })
        ]);
        const completionRate = totalEnrollments > 0
            ? (completedProgress / totalEnrollments) * 100
            : 0;
        const result = {
            totalEnrollments,
            completedCourses: completedProgress,
            completionRate: Math.round(completionRate)
        };
        return {
            success: true,
            data: result,
            message: 'Course completion stats retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve course completion stats',
            errors: [error.message]
        };
    }
};
exports.getCourseCompletionStats = getCourseCompletionStats;
//# sourceMappingURL=progress.service.js.map