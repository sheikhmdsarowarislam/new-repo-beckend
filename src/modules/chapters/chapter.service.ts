// src/modules/chapters/chapter.service.ts

import mongoose from "mongoose";
import Lecture from "../lectures/lecture.model";
import Quiz from "../quizes/quiz.model";
import { createError } from "../../utils/errorHandler";
import { withTransaction } from "../../utils/withTransaction";
import Chapter, { IChapter } from "./chapter.model";
import { invalidateCache, setCache, getCache } from "../../utils/cache";
import { generateCacheKey } from "../../utils/cacheKey";
import Course from "../courses/course.model";
import { ServiceResponse } from "../../@types/api";
import { reorderCourseChaptersWithConflictResolution, reorderCourseChaptersSimple } from "../../utils/chapterReorder";
import { updateCourseDuration } from "../courses/course.service";


// --- Type Definitions for Service Logic ---
const CHAPTER_CACHE_BASE = 'chapters';

// Inline ownership validation function
const validateCourseAndOwnership = async (courseId: string, userId: string, userRole: string): Promise<void> => {
  if (userRole === 'admin') return;
  
  const course = await Course.findById(courseId).lean();
  if (!course) {
    throw createError('Course not found', 404);
  }
  
  if (userRole === 'instructor' && course.instructor.toString() !== userId) {
    throw createError('You do not have permission to modify this course', 403);
  }
};

export type ICreateChapterData = { title: string; course: string; order?: number };
export type IUpdateChapterData = { title?: string; order?: number };
export type UserRole = 'admin' | 'instructor' | 'student';

// Utility function to update chapter duration (optimized - minimal DB calls)
export const updateChapterDuration = async (chapterId: string, session?: any): Promise<void> => {
  // OPTIMIZATION: Use aggregation pipeline for better performance - include both lectures and quizzes
  const [lectureResult, quizResult] = await Promise.all([
    Lecture.aggregate([
      { $match: { chapter: new mongoose.Types.ObjectId(chapterId) } },
      { $group: { _id: null, totalDuration: { $sum: { $ifNull: ['$duration', 0] } } } }
    ]).session(session),
    Quiz.aggregate([
      { $match: { chapter: new mongoose.Types.ObjectId(chapterId) } },
      { $group: { _id: null, totalDuration: { $sum: { $ifNull: ['$duration', 0] } } } }
    ]).session(session)
  ]);

  const lectureDuration = lectureResult.length > 0 ? lectureResult[0].totalDuration : 0;
  const quizDuration = quizResult.length > 0 ? quizResult[0].totalDuration : 0;
  const totalDuration = lectureDuration + quizDuration;
  
  // OPTIMIZATION: Use findOneAndUpdate for atomic update
  await Chapter.findByIdAndUpdate(
    chapterId, 
    { chapterDuration: totalDuration }, 
    { session }
  );
};

export const createChapter = async (data: ICreateChapterData, userId: string, userRole: UserRole): Promise<ServiceResponse<IChapter>> => {
  try {
    const chapter = await withTransaction(async (session) => {
      // SECURITY: Enforce ownership
      await validateCourseAndOwnership(data.course, userId, userRole);

      let order: number;
      
      if (data.order !== undefined) {
        // Use smart conflict resolution for specified order
        // Create chapter with temporary order first (since order field is required)
        const tempOrder = (await Chapter.countDocuments({ course: data.course }).session(session)) + 1000; // High temporary order
        const createdChapters = await Chapter.create([{ 
          title: data.title,
          course: data.course,
          order: tempOrder,
          chapterDuration: 0
        }], { session, ordered: true });
        
        if (createdChapters.length === 0 || !createdChapters[0]) {
          throw createError("Failed to create chapter", 500);
        }
        
        const chapter = createdChapters[0];
        
        // Apply smart reorder logic to place the chapter at the desired position
        await reorderCourseChaptersWithConflictResolution(
          data.course,
          [{ chapterId: (chapter._id as any).toString(), order: data.order }],
          session
        );
        
        // OPTIMIZATION: Batch cache invalidation operations
        const cacheKeys = [
            generateCacheKey('course', { id: data.course }),
            generateCacheKey(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: data.course }),
            "courses:list"
        ];
        
        Promise.all(cacheKeys.map(key => invalidateCache(key)))
            .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        
        return chapter;
      } else {
        // OPTIMIZATION: Use optimized count query
        order = (await Chapter.countDocuments({ course: data.course }).session(session)) + 1;
        const [chapter] = await Chapter.create([{ 
          title: data.title,
          course: data.course,
          order: order,
          chapterDuration: 0
        }], { session, ordered: true});

        // OPTIMIZATION: Batch cache invalidation operations
        const cacheKeys = [
          generateCacheKey('course', { id: data.course }),
          generateCacheKey(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: data.course }),
          "courses:list"
        ];
        
        Promise.all(cacheKeys.map(key => invalidateCache(key)))
          .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

        return chapter;
      }
    });

    return {
      success: true,
      data: chapter,
      message: 'Chapter created successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Chapter creation failed',
      errors: [error.message]
    };
  }
};


/**
 * Update Chapter (title / order) - OPTIMIZED VERSION
 * Reduces database calls by optimizing validation and reordering
 */
export const updateChapter = async (id: string, data: IUpdateChapterData, userId: string, userRole: UserRole): Promise<ServiceResponse<IChapter>> => {
  try {
    const chapter = await withTransaction(async (session) => {
      // OPTIMIZATION: Single query with projection to get only needed fields
      const chapter = await Chapter.findById(id, { 
        _id: 1, 
        title: 1, 
        order: 1, 
        course: 1 
      }).session(session);
      
      if (!chapter) throw createError("Chapter not found", 404);

      // SECURITY: Enforce ownership check on the course the chapter belongs to
      await validateCourseAndOwnership(chapter.course.toString(), userId, userRole);

      let hasChanges = false;

      // Update title if provided
      if (data.title !== undefined) {
        chapter.title = data.title;
        hasChanges = true;
      }

      // Handle order changes if provided
      if (data.order !== undefined && data.order !== chapter.order) {
        // Apply smart reorder logic for chapter order changes
        await reorderCourseChaptersWithConflictResolution(
          chapter.course.toString(),
          [{ chapterId: id, order: data.order }],
          session
        );
        // Update the local chapter object with the new order
        chapter.order = data.order;
        hasChanges = true;
      }

      // Save if there are any changes
      if (hasChanges) {
        await chapter.save({ session });
      }

      // OPTIMIZATION: Batch cache invalidation operations
      const cacheKeys = [
        generateCacheKey(CHAPTER_CACHE_BASE, { id: (chapter._id as any).toString() }),
        generateCacheKey('course', { id: chapter.course.toString() }),
        generateCacheKey(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: chapter.course.toString() }),
        "courses:list"
      ];
      
      // Execute cache invalidation in parallel (non-blocking)
      Promise.all(cacheKeys.map(key => invalidateCache(key)))
        .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

      return chapter;
    });

    return {
      success: true,
      data: chapter,
      message: 'Chapter updated successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Chapter update failed',
      errors: [error.message]
    };
  }
};

export const deleteChapterService = async (chapterId: string, userId: string, userRole: UserRole): Promise<ServiceResponse<IChapter>> => {
    try {
        const chapter = await withTransaction(async (session) => {
            const chapter = await Chapter.findById(chapterId).session(session);
            if (!chapter) throw createError("Chapter not found", 404);

            // 1. SECURITY: Enforce ownership
            await validateCourseAndOwnership(chapter.course.toString(), userId, userRole);

            // 2. CASCADING DELETE: Delete all associated Lectures (Lessons)
            // If this fails, the chapter deletion will roll back.
            await Lecture.deleteMany({ chapter: chapterId }, { session });

            // 3. Delete the Chapter
            const deletedChapter = await Chapter.findByIdAndDelete(chapterId, { session });

            // 4. Update course duration
            if (deletedChapter) {
                await updateCourseDuration(deletedChapter.course.toString());
            }

            // 5. Invalidate relevant caches (batch, non-blocking)
            if (deletedChapter) {
                const cacheKeys = [
                    generateCacheKey(CHAPTER_CACHE_BASE, { id: chapterId }),
                    generateCacheKey('course', { id: deletedChapter.course.toString() }),
                    generateCacheKey(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: deletedChapter.course.toString() }),
                    "courses:list"
                ];
                
                Promise.all(cacheKeys.map(key => invalidateCache(key)))
                    .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
            }
            
            return deletedChapter;
        });

        return {
            success: true,
            data: chapter!,
            message: 'Chapter deleted successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Chapter deletion failed',
            errors: [error.message]
        };
    }
};
/**
 * Reorder Chapters Only - SIMPLIFIED VERSION
 * Simple and efficient chapter reordering without lecture complexity
 */
export const reorderChapters = async (
    courseId: string, 
    orderList: { chapterId: string; order: number }[], 
    userId: string, 
    userRole: UserRole
): Promise<ServiceResponse<boolean>> => {
    try {
        await withTransaction(async (session) => {
            // 1. SECURITY: Enforce ownership (single call)
            await validateCourseAndOwnership(courseId, userId, userRole);

            // 2. SIMPLE: Use the existing chapter reorder function
            await reorderCourseChaptersSimple(courseId, orderList, session);
            
            // 3. OPTIMIZATION: Batch cache invalidation operations
            const cacheKeys = [
                generateCacheKey('course', { id: courseId }),
                generateCacheKey(`${CHAPTER_CACHE_BASE}:courseId`, { courseId }),
                "courses:list",
                ...orderList.map(c => generateCacheKey(CHAPTER_CACHE_BASE, { id: c.chapterId }))
            ];
            
            // Execute cache invalidation in parallel (non-blocking)
            Promise.all(cacheKeys.map(key => invalidateCache(key)))
                .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));

            return true;
        });

        return {
            success: true,
            data: true,
            message: 'Chapters reordered successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Chapter reordering failed',
            errors: [error.message]
        };
    }
};

export const getChaptersByCourse = async (courseId: string, cacheKey?: string): Promise<ServiceResponse<any>> => {
  try {
    if (cacheKey) {
      const cached = await getCache(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          message: 'Chapters retrieved from cache'
        };
      }
    }

    const chapters = await Chapter.find({ course: courseId })
      .select('title course order chapterDuration createdAt updatedAt')
      .sort({ order: 1 })
      .lean();
    
    const chaptersWithContent = await Promise.all(
      chapters.map(async (chapter) => {
        const [lectures, quizzes] = await Promise.all([
          Lecture.find({ chapter: chapter._id })
            .select('title videoUrl duration order isPreview resources')
            .sort({ order: 1 })
            .lean(),
          Quiz.find({ chapter: chapter._id })
            .select('title order questions')
            .sort({ order: 1 })
            .lean()
        ]);
        
        const content = [
          ...lectures.map(l => ({ ...l, type: 'lecture' as const })),
          ...quizzes.map(q => ({ ...q, type: 'quiz' as const }))
        ].sort((a, b) => a.order - b.order);
        
        return {
          ...chapter,
          lectures,
          quizzes,
          content
        };
      })
    );
    
    if (cacheKey) {
      await setCache(cacheKey, chaptersWithContent, 600);
    }
    
    return {
      success: true,
      data: chaptersWithContent,
      message: 'Chapters retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve chapters',
      errors: [error.message]
    };
  }
};

/**
 * Reorder content (lectures and quizzes) within a chapter
 */
export const reorderChapterContent = async (
  chapterId: string,
  items: { itemId: string; itemType: 'lecture' | 'quiz'; order: number }[]
): Promise<ServiceResponse<any>> => {
  try {
    // Separate lectures and quizzes
    const lectures = items.filter(item => item.itemType === 'lecture');
    const quizzes = items.filter(item => item.itemType === 'quiz');

    // Update lectures in bulk
    if (lectures.length > 0) {
      const lectureBulkOps = lectures.map(item => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(item.itemId) },
          update: { $set: { order: item.order } },
        },
      }));
      await Lecture.bulkWrite(lectureBulkOps);
    }

    // Update quizzes in bulk
    if (quizzes.length > 0) {
      const quizBulkOps = quizzes.map(item => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(item.itemId) },
          update: { $set: { order: item.order } },
        },
      }));
      await Quiz.bulkWrite(quizBulkOps);
    }

    // Get chapter to get courseId for cache invalidation
    const chapter = await Chapter.findById(chapterId).select('course').lean();
    
    if (chapter) {
      // Invalidate chapter cache
      const cacheKeys = [
        generateCacheKey('chapters', { id: chapterId }),
        generateCacheKey('chapters:courseId', { courseId: chapter.course.toString() }),
        generateCacheKey('course', { id: chapter.course.toString() }),
      ];
      
      await Promise.all(cacheKeys.map(key => invalidateCache(key)));
    }

    return {
      success: true,
      data: { updated: items.length },
      message: 'Chapter content reordered successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to reorder chapter content',
      errors: [error.message]
    };
  }
};

/**
 * Get Single Chapter (IMPLEMENTING CACHING)
 */
export const getChapterById = async (id: string): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use projection for better performance
    const chapter = await Chapter.findById(id)
      .select('title course order chapterDuration createdAt updatedAt')
      .lean();
    
    if (!chapter) {
      return {
        success: false,
        message: 'Chapter not found',
        errors: ['No chapter found with the provided ID']
      };
    }
    
    return {
      success: true,
      data: chapter,
      message: 'Chapter retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve chapter',
      errors: [error.message]
    };
  }
};

