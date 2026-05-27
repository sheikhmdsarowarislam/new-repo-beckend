"use strict";
// src/modules/lectures/lecture.services.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLectureLogic = getLectureLogic;
exports.createLectureLogic = createLectureLogic;
exports.updateLectureLogic = updateLectureLogic;
exports.deleteLectureLogic = deleteLectureLogic;
exports.reorderMultipleLecturesLogic = reorderMultipleLecturesLogic;
const mongoose_1 = require("mongoose");
const lectureRepository = __importStar(require("./lecture.repository"));
const lecture_model_1 = __importDefault(require("./lecture.model"));
const quiz_model_1 = __importDefault(require("../quizes/quiz.model"));
const contentReorder_1 = require("../../utils/contentReorder");
const cache_1 = require("../../utils/cache");
const cacheKey_1 = require("../../utils/cacheKey");
const chapter_service_1 = require("../chapters/chapter.service");
const course_service_1 = require("../courses/course.service");
// Helper function to invalidate lecture-related caches
const invalidateLectureCache = async (chapterId, courseId) => {
    const cacheKeys = [
        (0, cacheKey_1.generateCacheKey)('chapters', { id: chapterId }),
        (0, cacheKey_1.generateCacheKey)('chapters:courseId', { courseId }),
        (0, cacheKey_1.generateCacheKey)('course', { id: courseId }),
        'courses:list'
    ];
    await Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)));
};
async function getLectureLogic(id, cacheKey) {
    if (cacheKey) {
        const cached = await (0, cache_1.getCache)(cacheKey);
        if (cached) {
            return cached;
        }
    }
    const lecture = await lectureRepository.findLectureById(id);
    if (lecture && cacheKey) {
        await (0, cache_1.setCache)(cacheKey, lecture, 600);
    }
    return lecture;
}
async function createLectureLogic(data) {
    const chapterId = new mongoose_1.Types.ObjectId(data.chapter);
    const providedOrder = data.order;
    if (providedOrder === undefined) {
        // Append to the end: compute next order as max(order) + 1 across lectures and quizzes in this chapter
        const [maxLecture, maxQuiz] = await Promise.all([
            lecture_model_1.default.findOne({ chapter: chapterId }).sort({ order: -1 }).select('order').lean(),
            quiz_model_1.default.findOne({ chapter: chapterId }).sort({ order: -1 }).select('order').lean(),
        ]);
        const maxLectureOrder = maxLecture?.order ?? 0;
        const maxQuizOrder = maxQuiz?.order ?? 0;
        const nextOrder = Math.max(maxLectureOrder, maxQuizOrder) + 1;
        // Set computed order and create without shifting
        const lecture = await lectureRepository.createLectureData({ ...data, order: nextOrder });
        // Update chapter duration
        await (0, chapter_service_1.updateChapterDuration)(data.chapter);
        // Update course duration
        await (0, course_service_1.updateCourseDuration)(data.course);
        // Invalidate chapter cache
        invalidateLectureCache(data.chapter, data.course).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        return lecture;
    }
    // When explicit order is provided, shift existing content to make room
    await (0, contentReorder_1.shiftContentOrder)(chapterId, providedOrder, 1);
    const lecture = await lectureRepository.createLectureData(data);
    // Update chapter duration
    await (0, chapter_service_1.updateChapterDuration)(data.chapter);
    // Update course duration
    await (0, course_service_1.updateCourseDuration)(data.course);
    // Invalidate chapter cache
    invalidateLectureCache(data.chapter, data.course).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
    return lecture;
}
async function updateLectureLogic(id, update) {
    const existingLecture = await lectureRepository.findLectureById(id);
    if (!existingLecture)
        return null;
    const oldOrder = existingLecture.order;
    const newOrder = update.order;
    const chapterId = existingLecture.chapter;
    if (newOrder !== undefined && newOrder !== oldOrder) {
        // 1. BUSINESS LOGIC: Use the utility to shift all surrounding content
        await (0, contentReorder_1.resequenceContentOrder)(chapterId, existingLecture._id, lecture_model_1.default, // Pass the Mongoose Model
        oldOrder, newOrder);
        // Remove 'order' from update to prevent the repository from updating it again
        delete update.order;
    }
    // 2. DATA ACCESS: Update the remaining fields
    const updatedLecture = await lectureRepository.updateLectureData(id, update);
    // 3. Update chapter duration
    if (updatedLecture) {
        await (0, chapter_service_1.updateChapterDuration)(updatedLecture.chapter.toString());
        // 4. Update course duration
        await (0, course_service_1.updateCourseDuration)(updatedLecture.course.toString());
        // 5. Invalidate chapter cache
        invalidateLectureCache(updatedLecture.chapter.toString(), updatedLecture.course.toString()).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
    }
    return updatedLecture;
}
async function deleteLectureLogic(id) {
    const deletedLecture = await lectureRepository.deleteLectureData(id);
    if (deletedLecture) {
        // 1. BUSINESS LOGIC: Shift content back up (decrement order)
        await (0, contentReorder_1.shiftContentOrder)(deletedLecture.chapter, deletedLecture.order + 1, -1);
        // 2. Update chapter duration
        await (0, chapter_service_1.updateChapterDuration)(deletedLecture.chapter.toString());
        // 3. Update course duration
        await (0, course_service_1.updateCourseDuration)(deletedLecture.course.toString());
        // 4. Invalidate chapter cache
        invalidateLectureCache(deletedLecture.chapter.toString(), deletedLecture.course.toString()).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
    }
    return deletedLecture;
}
async function reorderMultipleLecturesLogic(chapterId, reorderData) {
    console.log('📝 Backend: Reordering lectures for chapter:', chapterId);
    console.log('📝 Backend: Reorder data:', JSON.stringify(reorderData, null, 2));
    // Update only the lectures specified
    await lectureRepository.updateLectureOrders(reorderData);
    console.log('✅ Backend: Lecture orders updated in DB');
    // Invalidate chapter cache - need to get courseId from one of the lectures
    if (reorderData.length > 0 && reorderData[0]) {
        const lecture = await lecture_model_1.default.findById(reorderData[0].lectureId).select('course').lean();
        if (lecture) {
            console.log('🗑️ Backend: Invalidating cache for course:', lecture.course.toString());
            invalidateLectureCache(chapterId, lecture.course.toString()).catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
        }
    }
    console.log('✅ Backend: Lecture reorder completed successfully');
}
//# sourceMappingURL=lecture.service.js.map