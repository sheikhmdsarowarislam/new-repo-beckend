// src/modules/progress/progress.repository.ts

import { Types, ClientSession } from 'mongoose';
import CourseProgress, { ICourseProgress } from './progress.model';


// --- READ Operations ---

export const findProgressById = (progressId: string, session?: ClientSession): Promise<any> => {
  return CourseProgress.findById(progressId)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findProgressByUserAndCourse = (
  userId: string, 
  courseId: string, 
  session?: ClientSession
): Promise<any> => {
  return CourseProgress.findOne({ user: userId, course: courseId })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findProgressByUser = (userId: string, session?: ClientSession): Promise<any[]> => {
  return CourseProgress.find({ user: userId })
    .populate('course', 'title thumbnail category level averageRating')
    .sort({ updatedAt: -1 })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};



export const countCompletedCoursesByUser = (userId: string, session?: ClientSession): Promise<number> => {
  return CourseProgress.countDocuments({ 
    user: userId, 
    isCourseCompleted: true 
  }).session(session || null);
};

export const countProgressByCourse = (courseId: string, session?: ClientSession): Promise<number> => {
  return CourseProgress.countDocuments({ course: courseId }).session(session || null);
};

export const countCompletedByCourse = (courseId: string, session?: ClientSession): Promise<number> => {
  return CourseProgress.countDocuments({ 
    course: courseId, 
    isCourseCompleted: true 
  }).session(session || null);
};

// --- WRITE Operations ---

export const createProgress = (data: Partial<ICourseProgress>, session?: ClientSession): Promise<ICourseProgress> => {
  return CourseProgress.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create progress document.");
    }
    return res[0]!;
  });
};

export const updateProgressById = (
  progressId: string, 
  updateData: Partial<ICourseProgress>, 
  session?: ClientSession
): Promise<ICourseProgress | null> => {
  return CourseProgress.findByIdAndUpdate(progressId, updateData, { 
    new: true, 
    runValidators: true 
  }).session(session || null);
};

export const updateProgressByUserAndCourse = (
  userId: string,
  courseId: string,
  updateData: Partial<ICourseProgress>, 
  session?: ClientSession
): Promise<ICourseProgress | null> => {
  return CourseProgress.findOneAndUpdate(
    { user: userId, course: courseId },
    updateData,
    { new: true, runValidators: true, upsert: true }
  ).session(session || null);
};

export const deleteProgressById = (progressId: string, session?: ClientSession): Promise<ICourseProgress | null> => {
  return CourseProgress.findByIdAndDelete(progressId).session(session || null);
};

export const deleteProgressByUserAndCourse = (
  userId: string,
  courseId: string,
  session?: ClientSession
): Promise<ICourseProgress | null> => {
  return CourseProgress.findOneAndDelete({ user: userId, course: courseId }).session(session || null);
};

// --- BULK Operations ---

export const bulkDeleteProgressByCourse = async (courseId: string, session?: ClientSession): Promise<void> => {
  await CourseProgress.deleteMany({ course: courseId }).session(session || null);
};

export const bulkDeleteProgressByUser = async (userId: string, session?: ClientSession): Promise<void> => {
  await CourseProgress.deleteMany({ user: userId }).session(session || null);
};

// --- AGGREGATION Operations ---

export const aggregateUserStats = async (userId: string): Promise<any> => {
  // OPTIMIZATION: Use more efficient aggregation pipeline
  return CourseProgress.aggregate([
    { $match: { user: new Types.ObjectId(userId) } },
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

export const aggregateCourseStats = async (courseId: string): Promise<any> => {
  // OPTIMIZATION: Use more efficient aggregation pipeline
  return CourseProgress.aggregate([
    { $match: { course: new Types.ObjectId(courseId) } },
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


export async function findOrCreateProgress(userId: string, courseId: string): Promise<ICourseProgress> {
  const progress = await CourseProgress.findOneAndUpdate(
      { user: userId, course: courseId },
      { 
          // Only set fields on insert
          $setOnInsert: { 
              user: userId, 
              course: courseId,
              completedLectures: new Map(),
              completedQuizzes: new Map(),
          } 
      },
      { 
          upsert: true, // Create if not found
          new: true, 
          runValidators: true 
      }
  );
  return progress!; 
}

export async function updateQuizProgress(
  progress: ICourseProgress, 
  quizId: string, 
  newScore: number
): Promise<ICourseProgress> {
  
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
      } else {
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

  const updatedProgress = await CourseProgress.findOneAndUpdate(
      { _id: progress._id },
      update,
      { new: true, runValidators: true }
  );
  
  return updatedProgress!;
}