// src/modules/progress/progress.service.ts

import { Types } from 'mongoose';
import { createError } from "../../utils/errorHandler";
import CourseProgress from "./progress.model";
import Lecture from "../lectures/lecture.model";
import Course from "../courses/course.model";
import Enrollment from "../enrollments/enrollment.model";
import Certificate from "../certificates/certificate.model";
import User from "../users/user.model";
import QuizModel from "../quizes/quiz.model";
import { createNotification } from "../notifications/notification.service";
import { sendEmail } from "../../utils/email";
import { ServiceResponse } from "../../@types/api";
import { invalidateCache } from "../../utils/cache";

const PROGRESS_CACHE_BASE = 'progress';

// Update lecture progress
export const updateLectureProgress = async (userId: string, lectureId: string, progressPercentage: number): Promise<ServiceResponse<any>> => {
    try {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) throw createError('Lecture not found', 404);
        
        // Check if user is enrolled
        const enrollment = await Enrollment.findOne({ student: userId, course: lecture.course });
        if (!enrollment) throw createError('Not enrolled in this course', 400);
        
        let courseProgress = await CourseProgress.findOne({ user: userId, course: lecture.course });
        
        if (!courseProgress) {
            courseProgress = new CourseProgress({
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
                courseProgress.lastViewedLecture = lectureId as any;
            }
        }
        
        // Check if course is completed (both lectures AND quizzes)
        const totalLectures = await Lecture.countDocuments({ course: lecture.course });
        const totalQuizzes = await QuizModel.countDocuments({ course: lecture.course });
        
        const allLecturesCompleted = courseProgress.totalLecturesCompleted >= totalLectures;
        const allQuizzesCompleted = courseProgress.totalQuizzesCompleted >= totalQuizzes;
        
        const wasCourseCompleted = courseProgress.isCourseCompleted;
        if (allLecturesCompleted && allQuizzesCompleted && !wasCourseCompleted) {
            courseProgress.isCourseCompleted = true;
            // Generate certificate when course is completed
            await generateCertificate(userId, lecture.course.toString());
        }
        
        await courseProgress.save();
        
        return {
            success: true,
            data: courseProgress,
            message: 'Lecture progress updated successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Lecture progress update failed',
            errors: [error.message]
        };
    }
};

// Get detailed course progress - OPTIMIZED
export const getCourseProgressService = async (userId: string, courseId: string): Promise<ServiceResponse<any>> => {
    try {
        // ✅ OPTIMIZED: Single query with all needed data
        const [progress, courseCounts] = await Promise.all([
            CourseProgress.findOne({ user: userId, course: courseId })
                .populate('course', 'title thumbnail')
                .populate('lastViewedLecture', 'title order'),
            // Get counts in parallel
            Promise.all([
                Lecture.countDocuments({ course: courseId }),
                QuizModel.countDocuments({ course: courseId })
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
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve course progress',
            errors: [error.message]
        };
    }
};


// Get user's learning dashboard - OPTIMIZED
export const getUserDashboard = async (userId: string): Promise<ServiceResponse<any>> => {
    try {
        // ✅ OPTIMIZATION: Start with enrollments to show ALL enrolled courses
        const enrollments = await Enrollment.find({ student: userId })
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
            const course = e.course as any;
            return course._id || course;
        });

        // Get progress data for all enrolled courses
        const progressRecords = await CourseProgress.find({ 
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
        const courseCountsPromises = courseIds.map(async (courseId: any) => {
            const [lectureCount, quizCount] = await Promise.all([
                Lecture.countDocuments({ course: courseId }),
                QuizModel.countDocuments({ course: courseId })
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
            const course = enrollment.course as any;
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
                        totalLecturesCompleted = (progress.completedLectures as any).size;
                    } else {
                        totalLecturesCompleted = Object.keys(progress.completedLectures).filter(
                            key => progress.completedLectures[key] === true
                        ).length;
                    }
                }
            }
            
            if (totalQuizzesCompleted === 0 && progress?.completedQuizzes) {
                if (typeof progress.completedQuizzes === 'object') {
                    if ('size' in progress.completedQuizzes) {
                        totalQuizzesCompleted = (progress.completedQuizzes as any).size;
                    } else {
                        totalQuizzesCompleted = Object.keys(progress.completedQuizzes).filter(
                            key => progress.completedQuizzes[key]?.completed === true
                        ).length;
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
        const totalRewardPoints = dashboardData.reduce((sum, course) => 
            sum + course.rewardPoints.totalPoints, 0
        );
        
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
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve dashboard',
            errors: [error.message]
        };
    }
};

// Generate certificate when course is completed
export const generateCertificate = async (userId: string, courseId: string): Promise<ServiceResponse<any>> => {
    try {
        // OPTIMIZATION: Use lean queries for better performance
        const [course, user] = await Promise.all([
            Course.findById(courseId).lean(),
            User.findById(userId).lean()
        ]);
        
        if (!course || !user) {
            return {
                success: false,
                message: 'Course or user not found',
                errors: ['Invalid course or user ID']
            };
        }
        
        // Check if certificate already exists
        const existingCertificate = await Certificate.findOne({ user: userId, course: courseId });
        if (existingCertificate) {
            // If a certificate exists, resend email/notification to ensure the user is informed
            try {
                await sendEmail(
                    user.email,
                    `🏆 Certificate Earned - CodeTutor LMS`,
                    'certificate-completion',
                    {
                        studentName: user.name,
                        courseTitle: course.title,
                        completionDate: new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }),
                        certificateId: existingCertificate.certificateId,
                        certificateUrl: existingCertificate.downloadUrl
                    }
                );
            } catch (error) {
                console.error('Failed to send existing certificate email:', error);
            }

            // Send in-app notification as well
            await createNotification(
                userId,
                'certificate_earned',
                `Congratulations! You've earned a certificate for completing ${course.title}`,
                courseId
            );

            return {
                success: true,
                data: existingCertificate,
                message: 'Certificate already exists. Email and notification sent.'
            };
        }
        
        // Generate unique certificate ID
        const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Create certificate
        const certificate = new Certificate({
            user: userId,
            course: courseId,
            certificateId,
            downloadUrl: `${process.env.BACKEND_URL || 'https://lms-backend-xyz.vercel.app'}/api/v1/certificates/download/${certificateId}`
        });
        
        await certificate.save();
        
        await invalidateCache(`certificate:${userId}:${courseId}`);
        
        // Send email notification
        try {
            await sendEmail(
                user.email,
                `🏆 Certificate Earned - CodeTutor LMS`,
                'certificate-completion',
                {
                    studentName: user.name,
                    courseTitle: course.title,
                    completionDate: new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    certificateId: certificateId,
                    certificateUrl: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/certificates/download/${certificateId}`
                }
            );
        } catch (error) {
            console.error('Failed to send certificate completion email:', error);
        }
        
        // Send in-app notification
        await createNotification(
            userId,
            'certificate_earned',
            `Congratulations! You've earned a certificate for completing ${course.title}`,
            courseId
        );
        
        return {
            success: true,
            data: certificate,
            message: 'Certificate generated successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Certificate generation failed',
            errors: [error.message]
        };
    }
};

// Update quiz progress when quiz is completed
export const updateQuizProgress = async (userId: string, quizId: string, score: number, courseId: string): Promise<ServiceResponse<any>> => {
    try {
        // Check if user is enrolled
        const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
        if (!enrollment) {
            return {
                success: false,
                message: 'User not enrolled in this course',
                errors: ['Not enrolled in this course']
            };
        }
        
        let courseProgress = await CourseProgress.findOne({ user: userId, course: courseId });
        
        if (!courseProgress) {
            courseProgress = new CourseProgress({
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
        const totalLectures = await Lecture.countDocuments({ course: courseId });
        const totalQuizzes = await QuizModel.countDocuments({ course: courseId });
        
        const allLecturesCompleted = courseProgress.totalLecturesCompleted >= totalLectures;
        const allQuizzesCompleted = courseProgress.totalQuizzesCompleted >= totalQuizzes;
        
        const wasCourseCompleted = courseProgress.isCourseCompleted;
        if (allLecturesCompleted && allQuizzesCompleted && !wasCourseCompleted) {
            courseProgress.isCourseCompleted = true;
            // Generate certificate when course is completed
            await generateCertificate(userId, courseId);
        }
        
        await courseProgress.save();
        
        return {
            success: true,
            data: courseProgress,
            message: 'Quiz progress updated successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Quiz progress update failed',
            errors: [error.message]
        };
    }
};

// Get course completion statistics - OPTIMIZED
export const getCourseCompletionStats = async (courseId: string): Promise<ServiceResponse<any>> => {
    try {
        // OPTIMIZATION: Use parallel queries for better performance
        const [totalEnrollments, completedProgress] = await Promise.all([
            Enrollment.countDocuments({ course: courseId }),
            CourseProgress.countDocuments({ 
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
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve course completion stats',
            errors: [error.message]
        };
    }
};

