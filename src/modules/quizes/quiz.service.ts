// src/modules/quizes/quiz.service.ts

import mongoose, { Types } from 'mongoose';
import { AppError } from "../../utils/errorHandler";
import { createError } from "../../utils/errorHandler";
import { withTransaction } from "../../utils/withTransaction";
import { invalidateCache, setCache, getCache, invalidateCacheBatch } from "../../utils/cache";
import { generateCacheKey } from "../../utils/cacheKey";
import { validateChapterBelongsToCourse } from "../../utils/chapterReorder";
import { shiftContentOrder, resequenceContentOrder } from "../../utils/contentReorder";
import Chapter from "../chapters/chapter.model";
import CourseProgress from "../progress/progress.model";
import Enrollment from "../enrollments/enrollment.model";
import Lecture from "../lectures/lecture.model";
import { ICreateQuizBody, IUpdateQuizBody, ISubmitQuizAttemptBody } from "./quiz.validation";
import { ServiceResponse } from "../../@types/api";

import { generateCertificate } from "../progress/progress.service";
import QuizModel, { IQuiz } from './quiz.model';
import { updateChapterDuration } from '../chapters/chapter.service';
import { updateCourseDuration } from '../courses/course.service';

const QUIZ_CACHE_BASE = 'quizzes';

// --- CORE SERVICE FUNCTIONS ---

/**
 * Create a new quiz with smart order conflict resolution
 * Similar to createLectureLogic but functional with proper error handling
 */
export const createQuizService = async (data: ICreateQuizBody, userId: string, userRole: string): Promise<ServiceResponse<IQuiz>> => {
    try {
        const quiz = await withTransaction(async (session) => {
            const courseId = data.course;
            const chapterId = data.chapter;

            // Validate chapter belongs to course
            const chapter = await validateChapterBelongsToCourse(chapterId, courseId, session);

            // Map validation questions to model shape
            const mappedQuestions = data.questions.map(q => ({
                questionText: q.questionText ?? (q as any).question, // backward compat
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
            }));

            const providedOrder = data.order;

            if (providedOrder === undefined) {
                // Append to the end: compute next order as max(order) + 1 across lectures and quizzes in this chapter
                const [maxLecture, maxQuiz] = await Promise.all([
                    Lecture.findOne({ chapter: new Types.ObjectId(chapterId) })
                        .sort({ order: -1 })
                        .select('order')
                        .session(session)
                        .lean(),
                    QuizModel.findOne({ chapter: new Types.ObjectId(chapterId) })
                        .sort({ order: -1 })
                        .select('order')
                        .session(session)
                        .lean(),
                ]);

                const maxLectureOrder = maxLecture?.order ?? 0;
                const maxQuizOrder = (maxQuiz as any)?.order ?? 0;
                const nextOrder = Math.max(maxLectureOrder, maxQuizOrder) + 1;

                // Set computed order and create without shifting
                const quizData = {
                    course: new Types.ObjectId(courseId),
                    chapter: new Types.ObjectId(chapterId),
                    title: data.title,
                    order: nextOrder,
                    questions: mappedQuestions
                };

                const createdQuiz = await QuizModel.create([quizData], { session, ordered: true });
                if (!createdQuiz[0]) throw new AppError("Failed to create quiz.", 500);

                // Update chapter duration
                await updateChapterDuration(chapterId, session);
                
                // Update course duration
                await updateCourseDuration(courseId);

                // Cache invalidation
                const cachePatterns = [
                    `${QUIZ_CACHE_BASE}:${createdQuiz[0]._id}`,
                    `chapter:${chapter._id}`,
                    `course:id=${courseId}`,
                    `quiz-results:courseId=${courseId}`
                ];
                invalidateCacheBatch(cachePatterns).catch(err => 
                    console.error('Cache invalidation failed (non-blocking):', err?.message || err)
                );

                return createdQuiz[0];
            } else {
                // When explicit order is provided, shift existing content to make room
                await shiftContentOrder(new Types.ObjectId(chapterId), providedOrder, 1);

                const quizData = {
                    course: new Types.ObjectId(courseId),
                    chapter: new Types.ObjectId(chapterId),
                    title: data.title,
                    order: providedOrder,
                    questions: mappedQuestions
                };

                const createdQuiz = await QuizModel.create([quizData], { session, ordered: true });
                if (!createdQuiz[0]) throw new AppError("Failed to create quiz.", 500);

                // Update chapter duration
                await updateChapterDuration(chapterId, session);
                
                // Update course duration
                await updateCourseDuration(courseId);

                // Cache invalidation
                const cachePatterns = [
                    `${QUIZ_CACHE_BASE}:${createdQuiz[0]._id}`,
                    `chapter:${chapter._id}`,
                    `course:id=${courseId}`,
                    `quiz-results:courseId=${courseId}`
                ];
                invalidateCacheBatch(cachePatterns).catch(err => 
                    console.error('Cache invalidation failed (non-blocking):', err?.message || err)
                );

                return createdQuiz[0];
            }
        });

        return {
            success: true,
            data: quiz,
            message: 'Quiz created successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Quiz creation failed',
            errors: [error.message]
        };
    }
};

/**
 * Update quiz with smart order conflict resolution
 */
export const updateQuizService = async (id: string, data: IUpdateQuizBody, userId: string, userRole: string): Promise<ServiceResponse<IQuiz>> => {
    try {
        const quiz = await withTransaction(async (session) => {
            const quiz = await QuizModel.findById(id).session(session);
            if (!quiz) throw new AppError("Quiz not found", 404);

            // 2. Update all fields including order
            const oldOrder = quiz.order;
            const newOrder = data.order;

            if (newOrder !== undefined && newOrder !== oldOrder) {
                await resequenceContentOrder(
                    quiz.chapter as Types.ObjectId,
                    quiz._id as Types.ObjectId,
                    QuizModel as any,
                    oldOrder,
                    newOrder
                );
                delete (data as any).order;
            }

            Object.assign(quiz, data);
            
            // 3. Save the updated quiz
            await quiz.save({ session });

            // 4. Update chapter duration
            await updateChapterDuration(quiz.chapter.toString(), session);
            
            // 5. Update course duration
            await updateCourseDuration(quiz.course.toString());

            // 6. Optimized cache invalidation (batch, non-blocking)
            const cachePatterns = [
              `${QUIZ_CACHE_BASE}:${quiz._id}`,
              `chapter:${quiz.chapter}`,
              generateCacheKey('course', { id: quiz.course.toString() }),
              generateCacheKey('chapters:courseId', { courseId: quiz.course.toString() }),
              `quiz-results:courseId=${quiz.course}`
            ];
            invalidateCacheBatch(cachePatterns).catch(err => 
              console.error('Cache invalidation failed (non-blocking):', err?.message || err)
            );

            return quiz;
        });

        return {
            success: true,
            data: quiz,
            message: 'Quiz updated successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Quiz update failed',
            errors: [error.message]
        };
    }
};

/**
 * Delete quiz
 */
export const deleteQuizService = async (id: string, userId: string, userRole: string): Promise<ServiceResponse<IQuiz>> => {
    try {
        const deletedQuiz = await withTransaction(async (session) => {
            const quiz = await QuizModel.findById(id).session(session);
            if (!quiz) throw new AppError("Quiz not found", 404);

            // Delete quiz
            const deletedQuiz = await QuizModel.findByIdAndDelete(id, { session});

            if (deletedQuiz) {
              // IMPORTANT: Shift content order down for items after this quiz
              await shiftContentOrder(deletedQuiz.chapter as Types.ObjectId, deletedQuiz.order + 1, -1);

              // Update chapter duration
              await updateChapterDuration(deletedQuiz.chapter.toString(), session);
              
              // Update course duration
              await updateCourseDuration(deletedQuiz.course.toString());

              // Optimized cache invalidation
              const cachePatterns = [
                `${QUIZ_CACHE_BASE}:${id}`,
                `chapter:${deletedQuiz.chapter}`,
                generateCacheKey('course', { id: deletedQuiz.course.toString() }),
                generateCacheKey('chapters:courseId', { courseId: deletedQuiz.course.toString() }),
                `quiz-results:courseId=${deletedQuiz.course}`
              ];
              invalidateCacheBatch(cachePatterns).catch(err => 
                console.error('Cache invalidation failed (non-blocking):', err?.message || err)
              );
            }

            return deletedQuiz;
        });

        return {
            success: true,
            data: deletedQuiz!,
            message: 'Quiz deleted successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Quiz deletion failed',
            errors: [error.message]
        };
    }
};

/**
 * Get quiz by ID with simple enrollment check
 */
export const getQuizByIdService = async (id: string, cacheKey: string, userId: string, userRole: string): Promise<ServiceResponse<any>> => {
    try {
        const quiz = await QuizModel.findById(id)
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
            const enrollment = await Enrollment.findOne({ 
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
        await setCache(cacheKey, responseData);
        
        return {
            success: true,
            data: responseData,
            message: 'Quiz retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve quiz',
            errors: [error.message]
        };
    }
};


/**
 * Submit quiz attempt with simple enrollment check
 */
export const submitQuizAttemptService = async (userId: string, quizId: string, data: ISubmitQuizAttemptBody): Promise<ServiceResponse<any>> => {
    try {
        const result = await withTransaction(async (session) => {
            const quiz = await QuizModel.findById(quizId).session(session);
            if (!quiz) throw createError('Quiz not found', 404);

            // Simple enrollment check for students
            const enrollment = await Enrollment.findOne({ 
                student: userId, 
                course: quiz.course 
            }).select('_id').session(session);

            if (!enrollment) {
                throw createError('You must be enrolled in this course to submit quiz attempts', 403);
            }

            // Calculate score
            let score = 0;
            const results = quiz.questions.map((question, index) => {
              const userAnswer = data.answers[index] ?? -1;
              const isCorrect = question.correctAnswer === userAnswer;
              if (isCorrect) score++;

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
              let courseProgress = await CourseProgress.findOne({ 
                user: userId, 
                course: quiz.course 
              }).session(session);

              if (!courseProgress) {
                courseProgress = new CourseProgress({
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
                QuizModel.countDocuments({ course: quiz.course }).session(session),
                Lecture.countDocuments({ course: quiz.course }).session(session)
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
              } else {
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
                await generateCertificate(userId, quiz.course.toString());
              }
              
              // Cache invalidation for enrolled course details
              const enrolledCourseCacheKey = `enrolled-course-details:courseId=${quiz.course}:userId=${userId}`;
              
              // Invalidate specific cache key
              await invalidateCache(enrolledCourseCacheKey).catch(err => 
                console.error('Cache invalidation failed:', err?.message || err)
              );
              
              // Invalidate related cache patterns
              const cachePatterns = [
                `progress:dashboard:${userId}`,
                `progress:courseId=${quiz.course}:${userId}`,
                `quiz-results:courseId=${quiz.course}`
              ];
              
              invalidateCacheBatch(cachePatterns).catch(err => 
                console.error('Batch cache invalidation failed:', err?.message || err)
              );
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
    } catch (error: any) {
        return {
            success: false,
            message: 'Quiz submission failed',
            errors: [error.message]
        };
    }
};

/**
 * Get quiz results for a course with simple enrollment check
 */
export const getQuizResultsService = async (userId: string, courseId: string, cacheKey?: string): Promise<ServiceResponse<any>> => {
    try {
        // Simple enrollment check for students
        const enrollment = await Enrollment.findOne({ 
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
            const cached = await getCache(cacheKey);
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
            QuizModel.find({ course: courseId })
                .select('_id title order questions')
                .sort({ order: 1 })
                .lean(),
            CourseProgress.findOne({ user: userId, course: courseId })
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
            await setCache(cacheKey, result, 300); // 5 minutes cache for quiz results
        }

        return {
            success: true,
            data: result,
            message: 'Quiz results retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve quiz results',
            errors: [error.message]
        };
    }
};