"use strict";
// src/modules/reviews/review.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateCourseReviewStats = exports.bulkDeleteReviewsByUser = exports.bulkDeleteReviewsByCourse = exports.deleteReviewById = exports.updateReviewById = exports.createReview = exports.countReviewsByUser = exports.countReviewsByCourse = exports.findReviewsByUser = exports.findReviewsByCourse = exports.findReviewByUserAndCourse = exports.findReviewById = void 0;
const mongoose_1 = require("mongoose");
const review_model_1 = __importDefault(require("./review.model"));
// --- READ Operations ---
const findReviewById = (reviewId, session) => {
    return review_model_1.default.findById(reviewId)
        .populate('user', 'name avatar')
        .populate('course', 'title thumbnail')
        .lean()
        .session(session || null)
        .exec();
};
exports.findReviewById = findReviewById;
const findReviewByUserAndCourse = (userId, courseId, session) => {
    return review_model_1.default.findOne({ user: userId, course: courseId })
        .populate('user', 'name avatar')
        .lean()
        .session(session || null)
        .exec();
};
exports.findReviewByUserAndCourse = findReviewByUserAndCourse;
const findReviewsByCourse = (courseId, options = {}, session) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;
    return review_model_1.default.find({ course: courseId })
        .populate('user', 'name avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean()
        .session(session || null)
        .exec();
};
exports.findReviewsByCourse = findReviewsByCourse;
const findReviewsByUser = (userId, options = {}, session) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    return review_model_1.default.find({ user: userId })
        .populate('course', 'title thumbnail instructor')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .session(session || null)
        .exec();
};
exports.findReviewsByUser = findReviewsByUser;
const countReviewsByCourse = (courseId, session) => {
    return review_model_1.default.countDocuments({ course: courseId })
        .session(session || null)
        .exec();
};
exports.countReviewsByCourse = countReviewsByCourse;
const countReviewsByUser = (userId, session) => {
    return review_model_1.default.countDocuments({ user: userId })
        .session(session || null)
        .exec();
};
exports.countReviewsByUser = countReviewsByUser;
// --- WRITE Operations ---
const createReview = (data, session) => {
    return review_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create review document.");
        }
        return res[0];
    });
};
exports.createReview = createReview;
const updateReviewById = (reviewId, updateData, session) => {
    return review_model_1.default.findByIdAndUpdate(reviewId, updateData, {
        new: true,
        runValidators: true
    })
        .populate('user', 'name avatar')
        .lean()
        .session(session || null)
        .exec();
};
exports.updateReviewById = updateReviewById;
const deleteReviewById = (reviewId, session) => {
    return review_model_1.default.findByIdAndDelete(reviewId)
        .lean()
        .session(session || null)
        .exec();
};
exports.deleteReviewById = deleteReviewById;
// --- BULK Operations ---
const bulkDeleteReviewsByCourse = async (courseId, session) => {
    await review_model_1.default.deleteMany({ course: courseId })
        .session(session || null)
        .exec();
};
exports.bulkDeleteReviewsByCourse = bulkDeleteReviewsByCourse;
const bulkDeleteReviewsByUser = async (userId, session) => {
    await review_model_1.default.deleteMany({ user: userId })
        .session(session || null)
        .exec();
};
exports.bulkDeleteReviewsByUser = bulkDeleteReviewsByUser;
// --- AGGREGATION Operations ---
const aggregateCourseReviewStats = async (courseId) => {
    return review_model_1.default.aggregate([
        { $match: { course: new mongoose_1.Types.ObjectId(courseId) } },
        {
            $group: {
                _id: "$course",
                totalReviews: { $sum: 1 },
                averageRating: { $avg: { $ifNull: ["$rating", 0] } },
                ratings: { $push: "$rating" }
            }
        },
        {
            $addFields: {
                ratingDistribution: {
                    "1": { $size: { $filter: { input: "$ratings", cond: { $eq: ["$$this", 1] } } } },
                    "2": { $size: { $filter: { input: "$ratings", cond: { $eq: ["$$this", 2] } } } },
                    "3": { $size: { $filter: { input: "$ratings", cond: { $eq: ["$$this", 3] } } } },
                    "4": { $size: { $filter: { input: "$ratings", cond: { $eq: ["$$this", 4] } } } },
                    "5": { $size: { $filter: { input: "$ratings", cond: { $eq: ["$$this", 5] } } } }
                }
            }
        },
        {
            $project: {
                totalReviews: 1,
                averageRating: { $round: [{ $ifNull: ["$averageRating", 0] }, 1] },
                ratingDistribution: 1
            }
        }
    ]);
};
exports.aggregateCourseReviewStats = aggregateCourseReviewStats;
//# sourceMappingURL=review.repository.js.map