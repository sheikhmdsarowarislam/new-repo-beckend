"use strict";
// src/modules/quizes/quiz.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizResultsService = exports.submitQuizAttemptService = exports.getQuizByIdService = exports.deleteQuizService = exports.updateQuizService = exports.createQuizService = void 0;
const mongoose_1 = require("mongoose");
const errorHandler_1 = require("../../utils/errorHandler");
const errorHandler_2 = require("../../utils/errorHandler");
const withTransaction_1 = require("../../utils/withTransaction");
const cache_1 = require("../../utils/cache");
const cacheKey_1 = require("../../utils/cacheKey");
const chapterReorder_1 = require("../../utils/chapterReorder");
const contentReorder_1 = require("../../utils/contentReorder");
const progress_model_1 = __importDefault(require("../progress/progress.model"));
const enrollment_model_1 = __importDefault(require("../enrollments/enrollment.model"));
const lecture_model_1 = __importDefault(require("../lectures/lecture.model"));
const progress_service_1 = require("../progress/progress.service");
const quiz_model_1 = __importDefault(require("./quiz.model"));
const chapter_service_1 = require("../chapters/chapter.service");
const course_service_1 = require("../courses/course.service");
const QUIZ_CACHE_BASE = 'quizzes';
// --- CORE SERVICE FUNCTIONS ---
/**
 * Create a new quiz with smart order conflict resolution
 * Similar to createLectureLogic but functional with proper error handling
 */
const createQuizService = async (data, userId, userRole) => {
    try {
        const quiz = await (0, withTransaction_1.withTransaction)(async (session) => {
            const courseId = data.course;
            const chapterId = data.chapter;
            // Validate chapter belongs to course
            const chapter = await (0, chapterReorder_1.validateChapterBelongsToCourse)(chapterId, courseId, session);
            // Map validation questions to model shape
            const mappedQuestions = data.questions.map(q => ({
                questionText: q.questionText ?? q.question, // backward compat
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
            }));
            const providedOrder = data.order;
            if (providedOrder === undefined) {
                // Append to the end: compute next order as max(order) + 1 across lectures and quizzes in this chapter
                const [maxLecture, maxQuiz] = await Promise.all([
                    lecture_model_1.default.findOne({ chapter: new mongoose_1.Types.ObjectId(chapterId) })
                        .sort({ order: -1 })
                        .select('order')
                        .session(session)
                        .lean(),
                    quiz_model_1.default.findOne({ chapter: new mongoose_1.Types.ObjectId(chapterId) })
                        .sort({ order: -1 })
                        .select('order')
                        .session(session)
                        .lean(),
                ]);
                const maxLectureOrder = maxLecture?.order ?? 0;
                const maxQuizOrder = maxQuiz?.order ?? 0;
                const nextOrder = Math.max(maxLectureOrder, maxQuizOrder) + 1;
                // Set computed order and create without shifting
                const quizData = {
                    course: new mongoose_1.Types.ObjectId(courseId),
                    chapter: new mongoose_1.Types.ObjectId(chapterId),
                    title: data.title,
                    order: nextOrder,
                    questions: mappedQuestions
                };
                const createdQuiz = await quiz_model_1.default.create([quizData], { session, ordered: true });
                if (!createdQuiz[0])
                    throw new errorHandler_1.AppError("Failed to create quiz.", 500);
                // Update chapter duration
                await (0, chapter_service_1.updateChapterDuration)(chapterId, session);
                // Update course duration
                await (0, course_service_1.updateCourseDuration)(courseId);
                // Cache invalidation
                const cachePatterns = [
                    `${QUIZ_CACHE_BASE}:${createdQuiz[0]._id}`,
                    `chapter:${chapter._id}`,
                    `course:id=${courseId}`,
                    `quiz-results:courseId=${courseId}`
                ];
                (0, cache_1.invalidateCacheBatch)(cachePatterns).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
                return createdQuiz[0];
            }
            else {
                // When explicit order is provided, shift existing content to make room
                await (0, contentReorder_1.shiftContentOrder)(new mongoose_1.Types.ObjectId(chapterId), providedOrder, 1);
                const quizData = {
                    course: new mongoose_1.Types.ObjectId(courseId),
                    chapter: new mongoose_1.Types.ObjectId(chapterId),
                    title: data.title,
                    order: providedOrder,
                    questions: mappedQuestions
                };
                const createdQuiz = await quiz_model_1.default.create([quizData], { session, ordered: true });
                if (!createdQuiz[0])
                    throw new errorHandler_1.AppError("Failed to create quiz.", 500);
                // Update chapter duration
                await (0, chapter_service_1.updateChapterDuration)(chapterId, session);
                // Update course duration
                await (0, course_service_1.updateCourseDuration)(courseId);
                // Cache invalidation
                const cachePatterns = [
                    `${QUIZ_CACHE_BASE}:${createdQuiz[0]._id}`,
                    `chapter:${chapter._id}`,
                    `course:id=${courseId}`,
                    `quiz-results:courseId=${courseId}`
                ];
                (0, cache_1.invalidateCacheBatch)(cachePatterns).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
                return createdQuiz[0];
            }
        });
        return {
            success: true,
            data: quiz,
            message: 'Quiz created successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Quiz creation failed',
            errors: [error.message]
        };
    }
};
exports.createQuizService = createQuizService;
/**
 * Update quiz with smart order conflict resolution
 */
const updateQuizService = async (id, data, userId, userRole) => {
    try {
        const quiz = await (0, withTransaction_1.withTransaction)(async (session) => {
            const quiz = await quiz_model_1.default.findById(id).session(session);
            if (!quiz)
                throw new errorHandler_1.AppError("Quiz not found", 404);
            // 2. Update all fields including order
            const oldOrder = quiz.order;
            const newOrder = data.order;
            if (newOrder !== undefined && newOrder !== oldOrder) {
                await (0, contentReorder_1.resequenceContentOrder)(quiz.chapter, quiz._id, quiz_model_1.default, oldOrder, newOrder);
                delete data.order;
            }
            Object.assign(quiz, data);
            // 3. Save the updated quiz
            await quiz.save({ session });
            // 4. Update chapter duration
            await (0, chapter_service_1.updateChapterDuration)(quiz.chapter.toString(), session);
            // 5. Update course duration
            await (0, course_service_1.updateCourseDuration)(quiz.course.toString());
            // 6. Optimized cache invalidation (batch, non-blocking)
            const cachePatterns = [
                `${QUIZ_CACHE_BASE}:${quiz._id}`,
                `chapter:${quiz.chapter}`,
                (0, cacheKey_1.generateCacheKey)('course', { id: quiz.course.toString() }),
                (0, cacheKey_1.generateCacheKey)('chapters:courseId', { courseId: quiz.course.toString() }),
                `quiz-results:courseId=${quiz.course}`
            ];
            (0, cache_1.invalidateCacheBatch)(cachePatterns).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
            return quiz;
        });
        return {
            success: true,
            data: quiz,
            message: 'Quiz updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Quiz update failed',
            errors: [error.message]
        };
    }
};
exports.updateQuizService = updateQuizService;
/**
 * Delete quiz
 */
const deleteQuizService = async (id, userId, userRole) => {
    try {
        const deletedQuiz = await (0, withTransaction_1.withTransaction)(async (session) => {
            const quiz = await quiz_model_1.default.findById(id).session(session);
            if (!quiz)
                throw new errorHandler_1.AppError("Quiz not found", 404);
            // Delete quiz
            const deletedQuiz = await quiz_model_1.default.findByIdAndDelete(id, { session });
            if (deletedQuiz) {
                // IMPORTANT: Shift content order down for items after this quiz
                await (0, contentReorder_1.shiftContentOrder)(deletedQuiz.chapter, deletedQuiz.order + 1, -1);
                // Update chapter duration
                await (0, chapter_service_1.updateChapterDuration)(deletedQuiz.chapter.toString(), session);
                // Update course duration
                await (0, course_service_1.updateCourseDuration)(deletedQuiz.course.toString());
                // Optimized cache invalidation
                const cachePatterns = [
                    `${QUIZ_CACHE_BASE}:${id}`,
                    `chapter:${deletedQuiz.chapter}`,
                    (0, cacheKey_1.generateCacheKey)('course', { id: deletedQuiz.course.toString() }),
                    (0, cacheKey_1.generateCacheKey)('chapters:courseId', { courseId: deletedQuiz.course.toString() }),
                    `quiz-results:courseId=${deletedQuiz.course}`
                ];
                (0, cache_1.invalidateCacheBatch)(cachePatterns).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
            }
            return deletedQuiz;
        });
        return {
            success: true,
            data: deletedQuiz,
            message: 'Quiz deleted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Quiz deletion failed',
            errors: [error.message]
        };
    }
};
exports.deleteQuizService = deleteQuizService;
/**
 * Get quiz by ID with simple enrollment check
 */
const getQuizByIdService = async (id, cacheKey, userId, userRole) => {
    try {
        const quiz = await quiz_model_1.default.findById(id)
            .select('_id title order questions course chapter')
            .populate('course', 'title')
            .populate('chapter', 'title order')
            .lean();
        if (!quiz) {
            return {
                success: false,
                message: 'Quiz not found',
                errors: ['No quiz found with the provided ID']
            };
        }
        // Simple enrollment check for students
        if (userRole === 'student') {
            const enrollment = await enrollment_model_1.default.findOne({
                student: userId,
                course: quiz.course
            }).select('_id').lean();
            if (!enrollment) {
                return {
                    success: false,
                    message: 'You must be enrolled in this course to access quiz content',
                    errors: ['Access denied - enrollment required']
                };
            }
        }
        const responseData = { quiz, cached: false };
        await (0, cache_1.setCache)(cacheKey, responseData);
        return {
            success: true,
            data: responseData,
            message: 'Quiz retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve quiz',
            errors: [error.message]
        };
    }
};
exports.getQuizByIdService = getQuizByIdService;
/**
 * Submit quiz attempt with simple enrollment check
 */
const submitQuizAttemptService = async (userId, quizId, data) => {
    try {
        const result = await (0, withTransaction_1.withTransaction)(async (session) => {
            const quiz = await quiz_model_1.default.findById(quizId).session(session);
            if (!quiz)
                throw (0, errorHandler_2.createError)('Quiz not found', 404);
            // Simple enrollment check for students
            const enrollment = await enrollment_model_1.default.findOne({
                student: userId,
                course: quiz.course
            }).select('_id').session(session);
            if (!enrollment) {
                throw (0, errorHandler_2.createError)('You must be enrolled in this course to submit quiz attempts', 403);
            }
            // Calculate score
            let score = 0;
            const results = quiz.questions.map((question, index) => {
                const userAnswer = data.answers[index] ?? -1;
                const isCorrect = question.correctAnswer === userAnswer;
                if (isCorrect)
                    score++;
                return {
                    question: question.questionText,
                    userAnswer,
                    correctAnswer: question.correctAnswer,
                    isCorrect,
                    explanation: question.explanation
                };
            });
            const percentage = (score / quiz.questions.length) * 100;
            const passed = percentage >= 70; // 70% passing score
            // Update course progress if passed - optimized with single aggregation
            if (passed) {
                // First, ensure course progress exists
                let courseProgress = await progress_model_1.default.findOne({
                    user: userId,
                    course: quiz.course
                }).session(session);
                if (!courseProgress) {
                    courseProgress = new progress_model_1.default({
                        user: userId,
                        course: quiz.course,
                        completedLectures: new Map(),
                        completedQuizzes: new Map(),
                        totalLecturesCompleted: 0,
                        totalQuizzesCompleted: 0,
                        quizzesCompleted: false,
                        averageQuizScore: 0,
                        isCourseCompleted: false
                    });
                    await courseProgress.save({ session });
                }
                // Optimized: Get totals with projection and lean queries
                const [totalQuizzes, totalLectures] = await Promise.all([
                    quiz_model_1.default.countDocuments({ course: quiz.course }).session(session),
                    lecture_model_1.default.countDocuments({ course: quiz.course }).session(session)
                ]);
                // Update the Map directly instead of using $set with nested path
                const quizKey = quizId.toString();
                const wasAlreadyCompleted = courseProgress.completedQuizzes.get(quizKey);
                if (!wasAlreadyCompleted) {
                    courseProgress.completedQuizzes.set(quizKey, {
                        completed: true,
                        score: percentage,
                        completedAt: new Date()
                    });
                    courseProgress.totalQuizzesCompleted += 1;
                }
                else {
                    // Update existing completion with new score
                    courseProgress.completedQuizzes.set(quizKey, {
                        completed: true,
                        score: percentage,
                        completedAt: new Date()
                    });
                }
                const allQuizzesCompleted = courseProgress.totalQuizzesCompleted >= totalQuizzes;
                const allLecturesCompleted = courseProgress.totalLecturesCompleted >= totalLectures;
                // Calculate average score efficiently
                const completedQuizScores = Array.from(courseProgress.completedQuizzes.values()).map(q => q.score);
                const averageScore = completedQuizScores.length > 0
                    ? completedQuizScores.reduce((sum, score) => sum + score, 0) / completedQuizScores.length
                    : 0;
                // Check if course was just completed
                const wasCourseCompleted = courseProgress.isCourseCompleted;
                const isNowCompleted = allLecturesCompleted && allQuizzesCompleted;
                // Update progress fields
                courseProgress.quizzesCompleted = allQuizzesCompleted;
                courseProgress.averageQuizScore = averageScore;
                courseProgress.isCourseCompleted = isNowCompleted;
                // Save the updated progress
                await courseProgress.save({ session });
                // Generate certificate if course is now completed (wasn't completed before)
                if (isNowCompleted && !wasCourseCompleted) {
                    await (0, progress_service_1.generateCertificate)(userId, quiz.course.toString());
                }
                // Cache invalidation for enrolled course details
                const enrolledCourseCacheKey = `enrolled-course-details:courseId=${quiz.course}:userId=${userId}`;
                // Invalidate specific cache key
                await (0, cache_1.invalidateCache)(enrolledCourseCacheKey).catch(err => console.error('Cache invalidation failed:', err?.message || err));
                // Invalidate related cache patterns
                const cachePatterns = [
                    `progress:dashboard:${userId}`,
                    `progress:courseId=${quiz.course}:${userId}`,
                    `quiz-results:courseId=${quiz.course}`
                ];
                (0, cache_1.invalidateCacheBatch)(cachePatterns).catch(err => console.error('Batch cache invalidation failed:', err?.message || err));
            }
            return {
                score: Math.round(percentage),
                passed,
                results,
                totalQuestions: quiz.questions.length,
                correctAnswers: score
            };
        });
        return {
            success: true,
            data: result,
            message: 'Quiz submitted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Quiz submission failed',
            errors: [error.message]
        };
    }
};
exports.submitQuizAttemptService = submitQuizAttemptService;
/**
 * Get quiz results for a course with simple enrollment check
 */
const getQuizResultsService = async (userId, courseId, cacheKey) => {
    try {
        // Simple enrollment check for students
        const enrollment = await enrollment_model_1.default.findOne({
            student: userId,
            course: courseId
        }).select('_id').lean();
        if (!enrollment) {
            return {
                success: false,
                message: 'You must be enrolled in this course to access quiz results',
                errors: ['Access denied - enrollment required']
            };
        }
        // Check cache first if cacheKey provided
        if (cacheKey) {
            const cached = await (0, cache_1.getCache)(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: { ...cached, cached: true },
                    message: 'Quiz results retrieved successfully'
                };
            }
        }
        // Optimized: Get quiz results and progress in parallel for better performance
        const [quizResults, courseProgress] = await Promise.all([
            quiz_model_1.default.find({ course: courseId })
                .select('_id title order questions')
                .sort({ order: 1 })
                .lean(),
            progress_model_1.default.findOne({ user: userId, course: courseId })
                .select('completedQuizzes averageQuizScore quizzesCompleted')
                .lean()
        ]);
        // Process quiz results with completion status
        const processedResults = quizResults.map(quiz => {
            const quizId = quiz._id.toString();
            const isCompleted = courseProgress?.completedQuizzes &&
                typeof courseProgress.completedQuizzes === 'object' &&
                quizId in courseProgress.completedQuizzes;
            const userScore = isCompleted && courseProgress?.completedQuizzes?.[quizId]?.score || null;
            return {
                _id: quiz._id,
                title: quiz.title,
                order: quiz.order,
                questionCount: quiz.questions.length,
                isCompleted,
                userScore
            };
        });
        const result = {
            totalQuizzes: processedResults.length,
            quizzesCompleted: courseProgress?.quizzesCompleted || false,
            averageScore: courseProgress?.averageQuizScore || 0,
            quizzes: processedResults.map(quiz => ({
                id: quiz._id,
                title: quiz.title,
                order: quiz.order,
                questionCount: quiz.questionCount,
                isCompleted: quiz.isCompleted,
                userScore: quiz.userScore
            }))
        };
        // Cache the result if cacheKey provided
        if (cacheKey) {
            await (0, cache_1.setCache)(cacheKey, result, 300); // 5 minutes cache for quiz results
        }
        return {
            success: true,
            data: result,
            message: 'Quiz results retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve quiz results',
            errors: [error.message]
        };
    }
};
exports.getQuizResultsService = getQuizResultsService;
//# sourceMappingURL=quiz.service.js.map