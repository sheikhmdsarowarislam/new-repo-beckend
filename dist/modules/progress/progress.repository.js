"use strict";
// src/modules/progress/progress.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateCourseStats = exports.aggregateUserStats = exports.bulkDeleteProgressByUser = exports.bulkDeleteProgressByCourse = exports.deleteProgressByUserAndCourse = exports.deleteProgressById = exports.updateProgressByUserAndCourse = exports.updateProgressById = exports.createProgress = exports.countCompletedByCourse = exports.countProgressByCourse = exports.countCompletedCoursesByUser = exports.findProgressByUser = exports.findProgressByUserAndCourse = exports.findProgressById = void 0;
exports.findOrCreateProgress = findOrCreateProgress;
exports.updateQuizProgress = updateQuizProgress;
const mongoose_1 = require("mongoose");
const progress_model_1 = __importDefault(require("./progress.model"));
// --- READ Operations ---
const findProgressById = (progressId, session) => {
    return progress_model_1.default.findById(progressId)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findProgressById = findProgressById;
const findProgressByUserAndCourse = (userId, courseId, session) => {
    return progress_model_1.default.findOne({ user: userId, course: courseId })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findProgressByUserAndCourse = findProgressByUserAndCourse;
const findProgressByUser = (userId, session) => {
    return progress_model_1.default.find({ user: userId })
        .populate('course', 'title thumbnail category level averageRating')
        .sort({ updatedAt: -1 })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findProgressByUser = findProgressByUser;
const countCompletedCoursesByUser = (userId, session) => {
    return progress_model_1.default.countDocuments({
        user: userId,
        isCourseCompleted: true
    }).session(session || null);
};
exports.countCompletedCoursesByUser = countCompletedCoursesByUser;
const countProgressByCourse = (courseId, session) => {
    return progress_model_1.default.countDocuments({ course: courseId }).session(session || null);
};
exports.countProgressByCourse = countProgressByCourse;
const countCompletedByCourse = (courseId, session) => {
    return progress_model_1.default.countDocuments({
        course: courseId,
        isCourseCompleted: true
    }).session(session || null);
};
exports.countCompletedByCourse = countCompletedByCourse;
// --- WRITE Operations ---
const createProgress = (data, session) => {
    return progress_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create progress document.");
        }
        return res[0];
    });
};
exports.createProgress = createProgress;
const updateProgressById = (progressId, updateData, session) => {
    return progress_model_1.default.findByIdAndUpdate(progressId, updateData, {
        new: true,
        runValidators: true
    }).session(session || null);
};
exports.updateProgressById = updateProgressById;
const updateProgressByUserAndCourse = (userId, courseId, updateData, session) => {
    return progress_model_1.default.findOneAndUpdate({ user: userId, course: courseId }, updateData, { new: true, runValidators: true, upsert: true }).session(session || null);
};
exports.updateProgressByUserAndCourse = updateProgressByUserAndCourse;
const deleteProgressById = (progressId, session) => {
    return progress_model_1.default.findByIdAndDelete(progressId).session(session || null);
};
exports.deleteProgressById = deleteProgressById;
const deleteProgressByUserAndCourse = (userId, courseId, session) => {
    return progress_model_1.default.findOneAndDelete({ user: userId, course: courseId }).session(session || null);
};
exports.deleteProgressByUserAndCourse = deleteProgressByUserAndCourse;
// --- BULK Operations ---
const bulkDeleteProgressByCourse = async (courseId, session) => {
    await progress_model_1.default.deleteMany({ course: courseId }).session(session || null);
};
exports.bulkDeleteProgressByCourse = bulkDeleteProgressByCourse;
const bulkDeleteProgressByUser = async (userId, session) => {
    await progress_model_1.default.deleteMany({ user: userId }).session(session || null);
};
exports.bulkDeleteProgressByUser = bulkDeleteProgressByUser;
// --- AGGREGATION Operations ---
const aggregateUserStats = async (userId) => {
    // OPTIMIZATION: Use more efficient aggregation pipeline
    return progress_model_1.default.aggregate([
        { $match: { user: new mongoose_1.Types.ObjectId(userId) } },
        {
            $group: {
                _id: "$user",
                totalCourses: { $sum: 1 },
                completedCourses: {
                    $sum: { $cond: [{ $eq: ["$isCourseCompleted", true] }, 1, 0] }
                },
                totalLecturesCompleted: { $sum: { $ifNull: ["$totalLecturesCompleted", 0] } },
                averageQuizScore: { $avg: { $ifNull: ["$averageQuizScore", 0] } }
            }
        }
    ]);
};
exports.aggregateUserStats = aggregateUserStats;
const aggregateCourseStats = async (courseId) => {
    // OPTIMIZATION: Use more efficient aggregation pipeline
    return progress_model_1.default.aggregate([
        { $match: { course: new mongoose_1.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: "$course",
                totalStudents: { $sum: 1 },
                completedStudents: {
                    $sum: { $cond: [{ $eq: ["$isCourseCompleted", true] }, 1, 0] }
                },
                averageProgress: {
                    $avg: {
                        $divide: [
                            { $ifNull: ["$totalLecturesCompleted", 0] },
                            { $ifNull: ["$totalLectures", 1] }
                        ]
                    }
                },
                averageQuizScore: { $avg: { $ifNull: ["$averageQuizScore", 0] } }
            }
        }
    ]);
};
exports.aggregateCourseStats = aggregateCourseStats;
async function findOrCreateProgress(userId, courseId) {
    const progress = await progress_model_1.default.findOneAndUpdate({ user: userId, course: courseId }, {
        // Only set fields on insert
        $setOnInsert: {
            user: userId,
            course: courseId,
            completedLectures: new Map(),
            completedQuizzes: new Map(),
        }
    }, {
        upsert: true, // Create if not found
        new: true,
        runValidators: true
    });
    return progress;
}
async function updateQuizProgress(progress, quizId, newScore) {
    const quizIdStr = quizId.toString();
    const currentQuizzesMap = progress.completedQuizzes;
    const existingEntry = currentQuizzesMap.get(quizIdStr);
    // NOTE: Hardcoded passing threshold. Use 70% as a standard assumption.
    const PASSING_THRESHOLD = 70;
    let quizCompleted = newScore >= PASSING_THRESHOLD;
    // Default values if no change is needed
    let updateNeeded = false;
    let newTotalQuizzesCompleted = progress.totalQuizzesCompleted;
    let newAverageQuizScore = progress.averageQuizScore;
    // --- Check if update is needed (Only update if new score is higher) ---
    if (!existingEntry || newScore > existingEntry.score) {
        updateNeeded = true;
        // 1. Calculate new sum for average score
        // Start with the existing sum of scores
        let totalScoreSum = (progress.totalQuizzesCompleted * progress.averageQuizScore);
        if (existingEntry) {
            // Subtract the old score's value from the sum
            totalScoreSum -= existingEntry.score;
            // 2. Adjust Completion Count
            // If the old score didn't pass, but the new one does, increment total completed
            if (!existingEntry.completed && quizCompleted) {
                newTotalQuizzesCompleted += 1;
            }
        }
        else {
            // This is the first entry
            if (quizCompleted) {
                newTotalQuizzesCompleted += 1;
            }
        }
        // Add the new score to the sum (only if it meets the completion criteria, which it does now)
        if (quizCompleted) {
            totalScoreSum += newScore;
        }
        // Recalculate average (prevent division by zero)
        newAverageQuizScore = newTotalQuizzesCompleted > 0
            ? (totalScoreSum / newTotalQuizzesCompleted)
            : 0;
    }
    if (!updateNeeded) {
        // No better score was achieved, so progress summary is unchanged.
        return progress;
    }
    // --- Mongoose Update Operation ---
    // Use Mongoose Map dot notation to update a specific key's value
    const update = {
        [`completedQuizzes.${quizIdStr}`]: {
            completed: quizCompleted,
            score: newScore,
            completedAt: new Date()
        },
        totalQuizzesCompleted: newTotalQuizzesCompleted,
        averageQuizScore: newAverageQuizScore,
        // NOTE: Full course completion check (isCourseCompleted) should happen here or after.
        // For simplicity, we assume lecture completion handles the final check.
    };
    const updatedProgress = await progress_model_1.default.findOneAndUpdate({ _id: progress._id }, update, { new: true, runValidators: true });
    return updatedProgress;
}
//# sourceMappingURL=progress.repository.js.map