// src/modules/quizes/quiz.repository.ts

import mongoose, { Types, ClientSession } from 'mongoose';
import QuizModel, { IQuiz } from './quiz.model';

// --- Types ---
export type QuizQueryOptions = {
  chapterId?: string;
  courseId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeQuestions?: boolean;
  userId?: string; // For enrollment filtering
};

// --- READ Operations ---

export const findQuizById = (quizId: string, session?: ClientSession): Promise<IQuiz | null> => {
  return QuizModel.findById(quizId).session(session || null);
};

export const findQuizzesByChapter = (chapterId: string, session?: ClientSession): Promise<IQuiz[]> => {
  return QuizModel.find({ chapter: chapterId }).sort({ order: 1 }).session(session || null);
};

export const findQuizzesByCourse = (courseId: string, session?: ClientSession): Promise<IQuiz[]> => {
  return QuizModel.find({ course: courseId })
    .populate('chapter', 'title order')
    .sort({ order: 1 })
    .session(session || null);
};

// Optimized function for getting quiz metadata without full questions
export const findQuizzesByCourseOptimized = (courseId: string, session?: ClientSession): Promise<IQuiz[]> => {
  return QuizModel.find({ course: courseId })
    .select('_id title order chapter course createdAt updatedAt')
    .populate('chapter', 'title order')
    .sort({ order: 1 })
    .lean()
    .session(session || null);
};

// Optimized function for getting quiz count and basic stats
export const getQuizStatsByCourse = async (courseId: string, session?: ClientSession): Promise<{
  totalQuizzes: number;
  totalQuestions: number;
  averageQuestionsPerQuiz: number;
}> => {
  const stats = await QuizModel.aggregate([
    { $match: { course: new Types.ObjectId(courseId) } },
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


// Removed complex enrollment check aggregation - access control handled at route level

export const countQuizzesByChapter = (chapterId: string, session?: ClientSession): Promise<number> => {
  return QuizModel.countDocuments({ chapter: chapterId }).session(session || null);
};

export const countQuizzesByCourse = (courseId: string, session?: ClientSession): Promise<number> => {
  return QuizModel.countDocuments({ course: courseId }).session(session || null);
};

// --- WRITE Operations ---

export const createQuiz = (data: Partial<IQuiz>, session?: ClientSession): Promise<IQuiz> => {
  return QuizModel.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create quiz document.");
    }
    return res[0]!;
  });
};

export const updateQuizById = (
  quizId: string, 
  updateData: Partial<IQuiz>, 
  session?: ClientSession
): Promise<IQuiz | null> => {
  return QuizModel.findByIdAndUpdate(quizId, updateData, { 
    new: true, 
    runValidators: true 
  }).session(session || null);
};

export const deleteQuizById = (quizId: string, session?: ClientSession): Promise<IQuiz | null> => {
  return QuizModel.findByIdAndDelete(quizId).session(session || null);
};

// --- BULK Operations ---

export const bulkUpdateQuizzes = async (
  operations: Array<{ quizId: string; order: number }>, 
  session?: ClientSession
): Promise<void> => {
  const bulkOps = operations.map((op) => ({
    updateOne: { 
      filter: { _id: op.quizId }, 
      update: { $set: { order: op.order } } 
    },
  }));
  
  if (bulkOps.length > 0) {
    await QuizModel.bulkWrite(bulkOps, { session: session || undefined, ordered: true });
  }
};

export const bulkDeleteQuizzesByChapter = async (chapterId: string, session?: ClientSession): Promise<void> => {
  await QuizModel.deleteMany({ chapter: chapterId }).session(session || null);
};

export const bulkDeleteQuizzesByCourse = async (courseId: string, session?: ClientSession): Promise<void> => {
  await QuizModel.deleteMany({ course: courseId }).session(session || null);
};

// --- AGGREGATION Operations ---

export const aggregateQuizStats = async (courseId: string): Promise<any> => {
  return QuizModel.aggregate([
    { $match: { course: new Types.ObjectId(courseId) } },
    {
      $group: {
        _id: "$course",
        totalQuizzes: { $sum: 1 },
        totalQuestions: { 
          $sum: { $size: "$questions" } 
        },
        averageQuestionsPerQuiz: { 
          $avg: { $size: "$questions" } 
        }
      }
    }
  ]);
};

// Simplified aggregation - moved complex logic to service layer
export const getQuizResultsWithProgress = async (courseId: string, userId: string): Promise<any> => {
  return QuizModel.aggregate([
    { $match: { course: new Types.ObjectId(courseId) } },
    {
      $lookup: {
        from: 'courseprogresses',
        let: { userId: new Types.ObjectId(userId), courseId: '$course' },
        pipeline: [
          { $match: { $expr: { $and: [
            { $eq: ['$course', '$$courseId'] },
            { $eq: ['$user', '$$userId'] }
          ]}}},
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
    { $sort: { order: 1 as 1 } }
  ]);
};

// Bulk quiz operations for better performance
export const bulkUpdateQuizOrder = async (
  updates: Array<{ quizId: string; order: number }>,
  session?: ClientSession
): Promise<void> => {
  const bulkOps = updates.map(({ quizId, order }) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(quizId) },
      update: { $set: { order } }
    }
  }));

  if (bulkOps.length > 0) {
    await QuizModel.bulkWrite(bulkOps, { session: session || undefined, ordered: false });
  }
};
