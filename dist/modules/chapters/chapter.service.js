"use strict";
// src/modules/chapters/chapter.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChapterById = exports.reorderChapterContent = exports.getChaptersByCourse = exports.reorderChapters = exports.deleteChapterService = exports.updateChapter = exports.createChapter = exports.updateChapterDuration = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const lecture_model_1 = __importDefault(require("../lectures/lecture.model"));
const quiz_model_1 = __importDefault(require("../quizes/quiz.model"));
const errorHandler_1 = require("../../utils/errorHandler");
const withTransaction_1 = require("../../utils/withTransaction");
const chapter_model_1 = __importDefault(require("./chapter.model"));
const cache_1 = require("../../utils/cache");
const cacheKey_1 = require("../../utils/cacheKey");
const course_model_1 = __importDefault(require("../courses/course.model"));
const chapterReorder_1 = require("../../utils/chapterReorder");
const course_service_1 = require("../courses/course.service");
// --- Type Definitions for Service Logic ---
const CHAPTER_CACHE_BASE = 'chapters';
// Inline ownership validation function
const validateCourseAndOwnership = async (courseId, userId, userRole) => {
    if (userRole === 'admin')
        return;
    const course = await course_model_1.default.findById(courseId).lean();
    if (!course) {
        throw (0, errorHandler_1.createError)('Course not found', 404);
    }
    if (userRole === 'instructor' && course.instructor.toString() !== userId) {
        throw (0, errorHandler_1.createError)('You do not have permission to modify this course', 403);
    }
};
// Utility function to update chapter duration (optimized - minimal DB calls)
const updateChapterDuration = async (chapterId, session) => {
    // OPTIMIZATION: Use aggregation pipeline for better performance - include both lectures and quizzes
    const [lectureResult, quizResult] = await Promise.all([
        lecture_model_1.default.aggregate([
            { $match: { chapter: new mongoose_1.default.Types.ObjectId(chapterId) } },
            { $group: { _id: null, totalDuration: { $sum: { $ifNull: ['$duration', 0] } } } }
        ]).session(session),
        quiz_model_1.default.aggregate([
            { $match: { chapter: new mongoose_1.default.Types.ObjectId(chapterId) } },
            { $group: { _id: null, totalDuration: { $sum: { $ifNull: ['$duration', 0] } } } }
        ]).session(session)
    ]);
    const lectureDuration = lectureResult.length > 0 ? lectureResult[0].totalDuration : 0;
    const quizDuration = quizResult.length > 0 ? quizResult[0].totalDuration : 0;
    const totalDuration = lectureDuration + quizDuration;
    // OPTIMIZATION: Use findOneAndUpdate for atomic update
    await chapter_model_1.default.findByIdAndUpdate(chapterId, { chapterDuration: totalDuration }, { session });
};
exports.updateChapterDuration = updateChapterDuration;
const createChapter = async (data, userId, userRole) => {
    try {
        const chapter = await (0, withTransaction_1.withTransaction)(async (session) => {
            // SECURITY: Enforce ownership
            await validateCourseAndOwnership(data.course, userId, userRole);
            let order;
            if (data.order !== undefined) {
                // Use smart conflict resolution for specified order
                // Create chapter with temporary order first (since order field is required)
                const tempOrder = (await chapter_model_1.default.countDocuments({ course: data.course }).session(session)) + 1000; // High temporary order
                const createdChapters = await chapter_model_1.default.create([{
                        title: data.title,
                        course: data.course,
                        order: tempOrder,
                        chapterDuration: 0
                    }], { session, ordered: true });
                if (createdChapters.length === 0 || !createdChapters[0]) {
                    throw (0, errorHandler_1.createError)("Failed to create chapter", 500);
                }
                const chapter = createdChapters[0];
                // Apply smart reorder logic to place the chapter at the desired position
                await (0, chapterReorder_1.reorderCourseChaptersWithConflictResolution)(data.course, [{ chapterId: chapter._id.toString(), order: data.order }], session);
                // OPTIMIZATION: Batch cache invalidation operations
                const cacheKeys = [
                    (0, cacheKey_1.generateCacheKey)('course', { id: data.course }),
                    (0, cacheKey_1.generateCacheKey)(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: data.course }),
                    "courses:list"
                ];
                Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
                    .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
                return chapter;
            }
            else {
                // OPTIMIZATION: Use optimized count query
                order = (await chapter_model_1.default.countDocuments({ course: data.course }).session(session)) + 1;
                const [chapter] = await chapter_model_1.default.create([{
                        title: data.title,
                        course: data.course,
                        order: order,
                        chapterDuration: 0
                    }], { session, ordered: true });
                // OPTIMIZATION: Batch cache invalidation operations
                const cacheKeys = [
                    (0, cacheKey_1.generateCacheKey)('course', { id: data.course }),
                    (0, cacheKey_1.generateCacheKey)(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: data.course }),
                    "courses:list"
                ];
                Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
                    .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
                return chapter;
            }
        });
        return {
            success: true,
            data: chapter,
            message: 'Chapter created successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Chapter creation failed',
            errors: [error.message]
        };
    }
};
exports.createChapter = createChapter;
/**
 * Update Chapter (title / order) - OPTIMIZED VERSION
 * Reduces database calls by optimizing validation and reordering
 */
const updateChapter = async (id, data, userId, userRole) => {
    try {
        const chapter = await (0, withTransaction_1.withTransaction)(async (session) => {
            // OPTIMIZATION: Single query with projection to get only needed fields
            const chapter = await chapter_model_1.default.findById(id, {
                _id: 1,
                title: 1,
                order: 1,
                course: 1
            }).session(session);
            if (!chapter)
                throw (0, errorHandler_1.createError)("Chapter not found", 404);
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
                await (0, chapterReorder_1.reorderCourseChaptersWithConflictResolution)(chapter.course.toString(), [{ chapterId: id, order: data.order }], session);
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
                (0, cacheKey_1.generateCacheKey)(CHAPTER_CACHE_BASE, { id: chapter._id.toString() }),
                (0, cacheKey_1.generateCacheKey)('course', { id: chapter.course.toString() }),
                (0, cacheKey_1.generateCacheKey)(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: chapter.course.toString() }),
                "courses:list"
            ];
            // Execute cache invalidation in parallel (non-blocking)
            Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
                .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
            return chapter;
        });
        return {
            success: true,
            data: chapter,
            message: 'Chapter updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Chapter update failed',
            errors: [error.message]
        };
    }
};
exports.updateChapter = updateChapter;
const deleteChapterService = async (chapterId, userId, userRole) => {
    try {
        const chapter = await (0, withTransaction_1.withTransaction)(async (session) => {
            const chapter = await chapter_model_1.default.findById(chapterId).session(session);
            if (!chapter)
                throw (0, errorHandler_1.createError)("Chapter not found", 404);
            // 1. SECURITY: Enforce ownership
            await validateCourseAndOwnership(chapter.course.toString(), userId, userRole);
            // 2. CASCADING DELETE: Delete all associated Lectures (Lessons)
            // If this fails, the chapter deletion will roll back.
            await lecture_model_1.default.deleteMany({ chapter: chapterId }, { session });
            // 3. Delete the Chapter
            const deletedChapter = await chapter_model_1.default.findByIdAndDelete(chapterId, { session });
            // 4. Update course duration
            if (deletedChapter) {
                await (0, course_service_1.updateCourseDuration)(deletedChapter.course.toString());
            }
            // 5. Invalidate relevant caches (batch, non-blocking)
            if (deletedChapter) {
                const cacheKeys = [
                    (0, cacheKey_1.generateCacheKey)(CHAPTER_CACHE_BASE, { id: chapterId }),
                    (0, cacheKey_1.generateCacheKey)('course', { id: deletedChapter.course.toString() }),
                    (0, cacheKey_1.generateCacheKey)(`${CHAPTER_CACHE_BASE}:courseId`, { courseId: deletedChapter.course.toString() }),
                    "courses:list"
                ];
                Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
                    .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
            }
            return deletedChapter;
        });
        return {
            success: true,
            data: chapter,
            message: 'Chapter deleted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Chapter deletion failed',
            errors: [error.message]
        };
    }
};
exports.deleteChapterService = deleteChapterService;
/**
 * Reorder Chapters Only - SIMPLIFIED VERSION
 * Simple and efficient chapter reordering without lecture complexity
 */
const reorderChapters = async (courseId, orderList, userId, userRole) => {
    try {
        await (0, withTransaction_1.withTransaction)(async (session) => {
            // 1. SECURITY: Enforce ownership (single call)
            await validateCourseAndOwnership(courseId, userId, userRole);
            // 2. SIMPLE: Use the existing chapter reorder function
            await (0, chapterReorder_1.reorderCourseChaptersSimple)(courseId, orderList, session);
            // 3. OPTIMIZATION: Batch cache invalidation operations
            const cacheKeys = [
                (0, cacheKey_1.generateCacheKey)('course', { id: courseId }),
                (0, cacheKey_1.generateCacheKey)(`${CHAPTER_CACHE_BASE}:courseId`, { courseId }),
                "courses:list",
                ...orderList.map(c => (0, cacheKey_1.generateCacheKey)(CHAPTER_CACHE_BASE, { id: c.chapterId }))
            ];
            // Execute cache invalidation in parallel (non-blocking)
            Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)))
                .catch(err => console.error('Cache invalidation failed (non-blocking):', err?.message || err));
            return true;
        });
        return {
            success: true,
            data: true,
            message: 'Chapters reordered successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Chapter reordering failed',
            errors: [error.message]
        };
    }
};
exports.reorderChapters = reorderChapters;
const getChaptersByCourse = async (courseId, cacheKey) => {
    try {
        if (cacheKey) {
            const cached = await (0, cache_1.getCache)(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: cached,
                    message: 'Chapters retrieved from cache'
                };
            }
        }
        const chapters = await chapter_model_1.default.find({ course: courseId })
            .select('title course order chapterDuration createdAt updatedAt')
            .sort({ order: 1 })
            .lean();
        const chaptersWithContent = await Promise.all(chapters.map(async (chapter) => {
            const [lectures, quizzes] = await Promise.all([
                lecture_model_1.default.find({ chapter: chapter._id })
                    .select('title videoUrl duration order isPreview resources')
                    .sort({ order: 1 })
                    .lean(),
                quiz_model_1.default.find({ chapter: chapter._id })
                    .select('title order questions')
                    .sort({ order: 1 })
                    .lean()
            ]);
            const content = [
                ...lectures.map(l => ({ ...l, type: 'lecture' })),
                ...quizzes.map(q => ({ ...q, type: 'quiz' }))
            ].sort((a, b) => a.order - b.order);
            return {
                ...chapter,
                lectures,
                quizzes,
                content
            };
        }));
        if (cacheKey) {
            await (0, cache_1.setCache)(cacheKey, chaptersWithContent, 600);
        }
        return {
            success: true,
            data: chaptersWithContent,
            message: 'Chapters retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve chapters',
            errors: [error.message]
        };
    }
};
exports.getChaptersByCourse = getChaptersByCourse;
/**
 * Reorder content (lectures and quizzes) within a chapter
 */
const reorderChapterContent = async (chapterId, items) => {
    try {
        // Separate lectures and quizzes
        const lectures = items.filter(item => item.itemType === 'lecture');
        const quizzes = items.filter(item => item.itemType === 'quiz');
        // Update lectures in bulk
        if (lectures.length > 0) {
            const lectureBulkOps = lectures.map(item => ({
                updateOne: {
                    filter: { _id: new mongoose_1.default.Types.ObjectId(item.itemId) },
                    update: { $set: { order: item.order } },
                },
            }));
            await lecture_model_1.default.bulkWrite(lectureBulkOps);
        }
        // Update quizzes in bulk
        if (quizzes.length > 0) {
            const quizBulkOps = quizzes.map(item => ({
                updateOne: {
                    filter: { _id: new mongoose_1.default.Types.ObjectId(item.itemId) },
                    update: { $set: { order: item.order } },
                },
            }));
            await quiz_model_1.default.bulkWrite(quizBulkOps);
        }
        // Get chapter to get courseId for cache invalidation
        const chapter = await chapter_model_1.default.findById(chapterId).select('course').lean();
        if (chapter) {
            // Invalidate chapter cache
            const cacheKeys = [
                (0, cacheKey_1.generateCacheKey)('chapters', { id: chapterId }),
                (0, cacheKey_1.generateCacheKey)('chapters:courseId', { courseId: chapter.course.toString() }),
                (0, cacheKey_1.generateCacheKey)('course', { id: chapter.course.toString() }),
            ];
            await Promise.all(cacheKeys.map(key => (0, cache_1.invalidateCache)(key)));
        }
        return {
            success: true,
            data: { updated: items.length },
            message: 'Chapter content reordered successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to reorder chapter content',
            errors: [error.message]
        };
    }
};
exports.reorderChapterContent = reorderChapterContent;
/**
 * Get Single Chapter (IMPLEMENTING CACHING)
 */
const getChapterById = async (id) => {
    try {
        // OPTIMIZATION: Use projection for better performance
        const chapter = await chapter_model_1.default.findById(id)
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
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve chapter',
            errors: [error.message]
        };
    }
};
exports.getChapterById = getChapterById;
//# sourceMappingURL=chapter.service.js.map