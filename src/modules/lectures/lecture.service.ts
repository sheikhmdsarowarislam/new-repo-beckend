// src/modules/lectures/lecture.services.ts

import { Types } from 'mongoose';
import * as lectureRepository from './lecture.repository';
import LectureModel, { ILecture } from './lecture.model';
import QuizModel from '../quizes/quiz.model';
import { shiftContentOrder, resequenceContentOrder } from '../../utils/contentReorder';
import { CreateLecturePayload, UpdateLecturePayload, ReorderItem } from './lecture.validation';
import { invalidateCache, getCache, setCache } from '../../utils/cache';
import { generateCacheKey } from '../../utils/cacheKey';
import { updateChapterDuration } from '../chapters/chapter.service';
import { updateCourseDuration } from '../courses/course.service';

type ReorderData = ReorderItem[];

// Helper function to invalidate lecture-related caches
const invalidateLectureCache = async (chapterId: string, courseId: string) => {
  const cacheKeys = [
    generateCacheKey('chapters', { id: chapterId }),
    generateCacheKey('chapters:courseId', { courseId }),
    generateCacheKey('course', { id: courseId }),
    'courses:list'
  ];
  
  await Promise.all(cacheKeys.map(key => invalidateCache(key)));
};

export async function getLectureLogic(id: string, cacheKey?: string): Promise<ILecture | null> {
  if (cacheKey) {
    const cached = await getCache<ILecture>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const lecture = await lectureRepository.findLectureById(id);
  
  if (lecture && cacheKey) {
    await setCache(cacheKey, lecture, 600);
  }
  
  return lecture;
}

export async function createLectureLogic(data: CreateLecturePayload): Promise<ILecture> {
  const chapterId = new Types.ObjectId(data.chapter);
  const providedOrder = data.order;

  if (providedOrder === undefined) {
    // Append to the end: compute next order as max(order) + 1 across lectures and quizzes in this chapter
    const [maxLecture, maxQuiz] = await Promise.all([
      LectureModel.findOne({ chapter: chapterId }).sort({ order: -1 }).select('order').lean(),
      QuizModel.findOne({ chapter: chapterId }).sort({ order: -1 }).select('order').lean(),
    ]);

    const maxLectureOrder = maxLecture?.order ?? 0;
    const maxQuizOrder = (maxQuiz as any)?.order ?? 0;
    const nextOrder = Math.max(maxLectureOrder, maxQuizOrder) + 1;

    // Set computed order and create without shifting
    const lecture = await lectureRepository.createLectureData({ ...data, order: nextOrder } as CreateLecturePayload);
    
    // Update chapter duration
    await updateChapterDuration(data.chapter);
    
    // Update course duration
    await updateCourseDuration(data.course);
    
    // Invalidate chapter cache
    invalidateLectureCache(data.chapter, data.course).catch(err => 
      console.error('Cache invalidation failed (non-blocking):', err?.message || err)
    );
    
    return lecture;
  }

  // When explicit order is provided, shift existing content to make room
  await shiftContentOrder(chapterId, providedOrder, 1);

  const lecture = await lectureRepository.createLectureData(data);
  
  // Update chapter duration
  await updateChapterDuration(data.chapter);
  
  // Update course duration
  await updateCourseDuration(data.course);
  
  // Invalidate chapter cache
  invalidateLectureCache(data.chapter, data.course).catch(err => 
    console.error('Cache invalidation failed (non-blocking):', err?.message || err)
  );
  
  return lecture;
}

export async function updateLectureLogic(id: string, update: Partial<UpdateLecturePayload>): Promise<ILecture | null> {
  const existingLecture = await lectureRepository.findLectureById(id);
  if (!existingLecture) return null;

  const oldOrder = existingLecture.order;
  const newOrder = update.order;
  const chapterId = existingLecture.chapter;

  if (newOrder !== undefined && newOrder !== oldOrder) {
    // 1. BUSINESS LOGIC: Use the utility to shift all surrounding content
    await resequenceContentOrder(
      chapterId,
      existingLecture._id as Types.ObjectId,
      LectureModel, // Pass the Mongoose Model
      oldOrder,
      newOrder
    );
    // Remove 'order' from update to prevent the repository from updating it again
    delete update.order;
  }

  // 2. DATA ACCESS: Update the remaining fields
  const updatedLecture = await lectureRepository.updateLectureData(id, update);
  
  // 3. Update chapter duration
  if (updatedLecture) {
    await updateChapterDuration(updatedLecture.chapter.toString());
    
    // 4. Update course duration
    await updateCourseDuration(updatedLecture.course.toString());
    
    // 5. Invalidate chapter cache
    invalidateLectureCache(
      updatedLecture.chapter.toString(), 
      updatedLecture.course.toString()
    ).catch(err => 
      console.error('Cache invalidation failed (non-blocking):', err?.message || err)
    );
  }
  
  return updatedLecture;
}

export async function deleteLectureLogic(id: string): Promise<ILecture | null> {
  const deletedLecture = await lectureRepository.deleteLectureData(id);
  if (deletedLecture) {
    // 1. BUSINESS LOGIC: Shift content back up (decrement order)
    await shiftContentOrder(deletedLecture.chapter, deletedLecture.order + 1, -1);
    
    // 2. Update chapter duration
    await updateChapterDuration(deletedLecture.chapter.toString());
    
    // 3. Update course duration
    await updateCourseDuration(deletedLecture.course.toString());
    
    // 4. Invalidate chapter cache
    invalidateLectureCache(
      deletedLecture.chapter.toString(), 
      deletedLecture.course.toString()
    ).catch(err => 
      console.error('Cache invalidation failed (non-blocking):', err?.message || err)
    );
  }
  return deletedLecture;
}

export async function reorderMultipleLecturesLogic(chapterId: string, reorderData: ReorderData): Promise<void> {
  console.log('📝 Backend: Reordering lectures for chapter:', chapterId);
  console.log('📝 Backend: Reorder data:', JSON.stringify(reorderData, null, 2));
  
  // Update only the lectures specified
  await lectureRepository.updateLectureOrders(reorderData);
  console.log('✅ Backend: Lecture orders updated in DB');
  
  // Invalidate chapter cache - need to get courseId from one of the lectures
  if (reorderData.length > 0 && reorderData[0]) {
    const lecture = await LectureModel.findById(reorderData[0].lectureId).select('course').lean();
    if (lecture) {
      console.log('🗑️ Backend: Invalidating cache for course:', lecture.course.toString());
      invalidateLectureCache(chapterId, lecture.course.toString()).catch(err => 
        console.error('Cache invalidation failed (non-blocking):', err?.message || err)
      );
    }
  }
  
  console.log('✅ Backend: Lecture reorder completed successfully');
}