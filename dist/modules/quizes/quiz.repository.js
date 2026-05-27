"use strict";
// src/modules/quizes/quiz.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateQuizOrder = exports.getQuizResultsWithProgress = exports.aggregateQuizStats = exports.bulkDeleteQuizzesByCourse = exports.bulkDeleteQuizzesByChapter = exports.bulkUpdateQuizzes = exports.deleteQuizById = exports.updateQuizById = exports.createQuiz = exports.countQuizzesByCourse = exports.countQuizzesByChapter = exports.getQuizStatsByCourse = exports.findQuizzesByCourseOptimized = exports.findQuizzesByCourse = exports.findQuizzesByChapter = exports.findQuizById = void 0;
const mongoose_1 = require("mongoose");
const quiz_model_1 = __importDefault(require("./quiz.model"));
// --- READ Operations ---
const findQuizById = (quizId, session) => {
    return quiz_model_1.default.findById(quizId)
        .lean()
        .session(session || null)
        .exec();
};
exports.findQuizById = findQuizById;
const findQuizzesByChapter = (chapterId, session) => {
    return quiz_model_1.default.find({ chapter: chapterId })
        .sort({ order: 1 })
        .lean()
        .session(session || null)
        .exec();
};
exports.findQuizzesByChapter = findQuizzesByChapter;
const findQuizzesByCourse = (courseId, session) => {
    return quiz_model_1.default.find({ course: courseId })
        .populate('chapter', 'title order')
        .sort({ order: 1 })
        .lean()
        .session(session || null)
        .exec();
};
exports.findQuizzesByCourse = findQuizzesByCourse;
const findQuizzesByCourseOptimized = (courseId, session) => {
    return quiz_model_1.default.find({ course: courseId })
        .select('_id title order chapter course createdAt updatedAt')
        .populate('chapter', 'title order')
        .sort({ order: 1 })
        .lean()
        .session(session || null)
        .exec();
};
exports.findQuizzesByCourseOptimized = findQuizzesByCourseOptimized;
const getQuizStatsByCourse = async (courseId, session) => {
    const stats = await quiz_model_1.default.aggregate([
        { $match: { course: new mongoose_1.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: null,
                totalQuizzes: { $sum: 1 },
                totalQuestions: { $sum: { $size: '$questions' } },
                averageQuestionsPerQuiz: { $avg: { $size: '$questions' } }
            }
        }
    ]).session(session || null);
    return stats[0] || { totalQuizzes: 0, totalQuestions: 0, averageQuestionsPerQuiz: 0 };
};
exports.getQuizStatsByCourse = getQuizStatsByCourse;
const countQuizzesByChapter = (chapterId, session) => {
    return quiz_model_1.default.countDocuments({ chapter: chapterId })
        .session(session || null)
        .exec();
};
exports.countQuizzesByChapter = countQuizzesByChapter;
const countQuizzesByCourse = (courseId, session) => {
    return quiz_model_1.default.countDocuments({ course: courseId })
        .session(session || null)
        .exec();
};
exports.countQuizzesByCourse = countQuizzesByCourse;
// --- WRITE Operations ---
const createQuiz = (data, session) => {
    return quiz_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create quiz document.");
        }
        return res[0];
    });
};
exports.createQuiz = createQuiz;
const updateQuizById = (quizId, updateData, session) => {
    return quiz_model_1.default.findByIdAndUpdate(quizId, updateData, {
        new: true,
        runValidators: true
    })
        .lean()
        .session(session || null)
        .exec();
};
exports.updateQuizById = updateQuizById;
const deleteQuizById = (quizId, session) => {
    return quiz_model_1.default.findByIdAndDelete(quizId)
        .lean()
        .session(session || null)
        .exec();
};
exports.deleteQuizById = deleteQuizById;
// --- BULK Operations ---
const bulkUpdateQuizzes = async (operations, session) => {
    const bulkOps = operations.map((op) => ({
        updateOne: {
            filter: { _id: op.quizId },
            update: { $set: { order: op.order } }
        },
    }));
    if (bulkOps.length > 0) {
        await quiz_model_1.default.bulkWrite(bulkOps, { session: session || undefined, ordered: true });
    }
};
exports.bulkUpdateQuizzes = bulkUpdateQuizzes;
const bulkDeleteQuizzesByChapter = async (chapterId, session) => {
    await quiz_model_1.default.deleteMany({ chapter: chapterId })
        .session(session || null)
        .exec();
};
exports.bulkDeleteQuizzesByChapter = bulkDeleteQuizzesByChapter;
const bulkDeleteQuizzesByCourse = async (courseId, session) => {
    await quiz_model_1.default.deleteMany({ course: courseId })
        .session(session || null)
        .exec();
};
exports.bulkDeleteQuizzesByCourse = bulkDeleteQuizzesByCourse;
// --- AGGREGATION Operations ---
const aggregateQuizStats = async (courseId) => {
    return quiz_model_1.default.aggregate([
        { $match: { course: new mongoose_1.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: "$course",
                totalQuizzes: { $sum: 1 },
                totalQuestions: { $sum: { $size: "$questions" } },
                averageQuestionsPerQuiz: { $avg: { $size: "$questions" } }
            }
        }
    ]);
};
exports.aggregateQuizStats = aggregateQuizStats;
const getQuizResultsWithProgress = async (courseId, userId) => {
    return quiz_model_1.default.aggregate([
        { $match: { course: new mongoose_1.Types.ObjectId(courseId) } },
        {
            $lookup: {
                from: 'courseprogresses',
                let: { userId: new mongoose_1.Types.ObjectId(userId), courseId: '$course' },
                pipeline: [
                    { $match: { $expr: { $and: [
                                    { $eq: ['$course', '$$courseId'] },
                                    { $eq: ['$user', '$$userId'] }
                                ] } } },
                    { $project: { completedQuizzes: 1 } }
                ],
                as: 'progress'
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                order: 1,
                questionCount: { $size: '$questions' },
                progress: { $arrayElemAt: ['$progress', 0] }
            }
        },
        { $sort: { order: 1 } }
    ]);
};
exports.getQuizResultsWithProgress = getQuizResultsWithProgress;
const bulkUpdateQuizOrder = async (updates, session) => {
    const bulkOps = updates.map(({ quizId, order }) => ({
        updateOne: {
            filter: { _id: new mongoose_1.Types.ObjectId(quizId) },
            update: { $set: { order } }
        }
    }));
    if (bulkOps.length > 0) {
        await quiz_model_1.default.bulkWrite(bulkOps, { session: session || undefined, ordered: false });
    }
};
exports.bulkUpdateQuizOrder = bulkUpdateQuizOrder;
//# sourceMappingURL=quiz.repository.js.map