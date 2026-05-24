// src/modules/reviews/review.repository.ts

import { Types, ClientSession } from 'mongoose';
import Review, { IReview } from './review.model';


// --- READ Operations ---

export const findReviewById = (reviewId: string, session?: ClientSession): Promise<IReview | null> => {
  return Review.findById(reviewId)
    .populate('user', 'name avatar')
    .populate('course', 'title thumbnail')
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findReviewByUserAndCourse = (
  userId: string, 
  courseId: string, 
  session?: ClientSession
): Promise<IReview | null> => {
  return Review.findOne({ user: userId, course: courseId })
    .populate('user', 'name avatar')
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findReviewsByCourse = (
  courseId: string, 
  options: any = {},
  session?: ClientSession
): Promise<IReview[]> => {
  const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
  const skip = (page - 1) * limit;
  
  const sortObj: any = {};
  sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

  return Review.find({ course: courseId })
    .populate('user', 'name avatar')
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findReviewsByUser = (
  userId: string, 
  options: any = {},
  session?: ClientSession
): Promise<IReview[]> => {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  return Review.find({ user: userId })
    .populate('course', 'title thumbnail instructor')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};


export const countReviewsByCourse = (courseId: string, session?: ClientSession): Promise<number> => {
  return Review.countDocuments({ course: courseId }).session(session || null);
};

export const countReviewsByUser = (userId: string, session?: ClientSession): Promise<number> => {
  return Review.countDocuments({ user: userId }).session(session || null);
};

// --- WRITE Operations ---

export const createReview = (data: Partial<IReview>, session?: ClientSession): Promise<IReview> => {
  return Review.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create review document.");
    }
    return res[0]!;
  });
};

export const updateReviewById = (
  reviewId: string, 
  updateData: Partial<IReview>, 
  session?: ClientSession
): Promise<IReview | null> => {
  return Review.findByIdAndUpdate(reviewId, updateData, { 
    new: true, 
    runValidators: true 
  }).populate('user', 'name avatar').session(session || null);
};

export const deleteReviewById = (reviewId: string, session?: ClientSession): Promise<IReview | null> => {
  return Review.findByIdAndDelete(reviewId).session(session || null);
};


// --- BULK Operations ---

export const bulkDeleteReviewsByCourse = async (courseId: string, session?: ClientSession): Promise<void> => {
  await Review.deleteMany({ course: courseId }).session(session || null);
};

export const bulkDeleteReviewsByUser = async (userId: string, session?: ClientSession): Promise<void> => {
  await Review.deleteMany({ user: userId }).session(session || null);
};

// --- AGGREGATION Operations ---

export const aggregateCourseReviewStats = async (courseId: string): Promise<any> => {
  // OPTIMIZATION: Use more efficient aggregation pipeline
  return Review.aggregate([
    { $match: { course: new Types.ObjectId(courseId) } },
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


