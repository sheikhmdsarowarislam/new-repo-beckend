"use strict";
// src/utils/chapterReorder.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateChapterBelongsToCourse = exports.reorderCourseChaptersSimple = exports.reorderCourseChaptersWithConflictResolution = void 0;
const errorHandler_1 = require("./errorHandler");
const chapter_model_1 = __importDefault(require("../modules/chapters/chapter.model"));
/**
 * Smart reorder logic for chapters within a course
 * Handles order conflicts by placing chapters in the next available position
 * OPTIMIZED: Reduces database calls and improves performance
 *
 * @param courseId - The course ID containing the chapters
 * @param orderList - Array of chapters to reorder with their target positions
 * @param session - MongoDB session for transaction support
 * @returns Promise<ReorderResult[]> - The final ordering of all chapters
 */
const reorderCourseChaptersWithConflictResolution = async (courseId, orderList, session) => {
    // OPTIMIZATION: Early return if no items to reorder
    if (!orderList.length) {
        return [];
    }
    // OPTIMIZATION: Single query to get all chapters with minimal fields and index hint
    // Robustness: If the hinted index doesn't exist in this environment, fall back without the hint
    let allChapters;
    try {
        allChapters = await chapter_model_1.default.find({ course: courseId }, { _id: 1, order: 1, createdAt: 1 }).sort({ order: 1, createdAt: 1 }).session(session).hint({ course: 1, order: 1 });
    }
    catch (err) {
        const message = err?.message || '';
        const isBadHint = message.includes('hint provided does not correspond to an existing index');
        if (!isBadHint)
            throw err;
        // Retry without hint
        allChapters = await chapter_model_1.default.find({ course: courseId }, { _id: 1, order: 1, createdAt: 1 }).sort({ order: 1, createdAt: 1 }).session(session);
    }
    if (!allChapters.length) {
        throw (0, errorHandler_1.createError)("No chapters found in this course", 404);
    }
    // OPTIMIZATION: Create lookup map for O(1) validation
    const chapterMap = new Map(allChapters.map(chapter => [
        chapter._id.toString(),
        { order: chapter.order, createdAt: chapter.createdAt }
    ]));
    // OPTIMIZATION: Batch validation - check all chapters at once
    const missingChapters = orderList.filter(({ chapterId }) => !chapterMap.has(chapterId));
    if (missingChapters.length > 0) {
        const missingIds = missingChapters.map(item => item.chapterId).join(', ');
        throw (0, errorHandler_1.createError)(`Chapters not found in course ${courseId}: ${missingIds}`, 404);
    }
    // OPTIMIZATION: Simplified reordering algorithm with better performance
    const allItems = Array.from(chapterMap.entries()).map(([id, data]) => ({
        id,
        order: data.order,
        createdAt: data.createdAt
    }));
    // Create final ordering map
    const finalOrdering = new Map();
    const placedItems = new Set();
    // Sort reorder requests by target position
    const sortedReorders = [...orderList].sort((a, b) => a.order - b.order);
    // Place items with explicit positions
    for (const { chapterId, order } of sortedReorders) {
        finalOrdering.set(chapterId, order);
        placedItems.add(chapterId);
    }
    // Place remaining items in their current order
    let nextOrder = 1;
    const usedOrders = new Set(Array.from(finalOrdering.values()));
    for (const item of allItems) {
        if (!placedItems.has(item.id)) {
            // Find next available order number more efficiently
            while (usedOrders.has(nextOrder)) {
                nextOrder++;
            }
            finalOrdering.set(item.id, nextOrder);
            usedOrders.add(nextOrder);
            nextOrder++;
        }
    }
    // OPTIMIZATION: Single bulk operation with optimized updates
    const bulkOps = Array.from(finalOrdering.entries()).map(([chapterId, newOrder]) => ({
        updateOne: {
            filter: { _id: chapterId, course: courseId },
            update: { $set: { order: newOrder } }
        },
    }));
    // Execute single bulk operation
    if (bulkOps.length > 0) {
        await chapter_model_1.default.bulkWrite(bulkOps, {
            session,
            ordered: false, // Allow parallel execution for better performance
            writeConcern: { w: 1 } // Reduce write concern for better performance
        });
    }
    // Return results in the same format
    return Array.from(finalOrdering.entries()).map(([itemId, newOrder]) => ({
        itemId,
        itemType: 'chapter',
        newOrder
    }));
};
exports.reorderCourseChaptersWithConflictResolution = reorderCourseChaptersWithConflictResolution;
/**
 * Extremely simple reorder: apply provided orders, then normalize all orders to 1..n
 * within the course by current (order ASC, createdAt ASC).
 * This avoids complex conflict handling and guarantees a contiguous order.
 */
const reorderCourseChaptersSimple = async (courseId, orderList, session) => {
    if (!orderList.length)
        return [];
    // 1) Ensure all provided chapters belong to this course
    const providedIds = orderList.map(i => i.chapterId);
    const chaptersInCourse = await chapter_model_1.default.find({ _id: { $in: providedIds }, course: courseId }, { _id: 1 }).session(session);
    if (chaptersInCourse.length !== providedIds.length) {
        throw (0, errorHandler_1.createError)("Some chapters do not belong to the specified course", 404);
    }
    // 2) Apply provided orders via bulkWrite
    const bulkSetOps = orderList.map(({ chapterId, order }) => ({
        updateOne: {
            filter: { _id: chapterId, course: courseId },
            update: { $set: { order } }
        }
    }));
    if (bulkSetOps.length) {
        await chapter_model_1.default.bulkWrite(bulkSetOps, { session, ordered: false, writeConcern: { w: 1 } });
    }
    // 3) Normalize orders to 1..n deterministically
    let allChapters;
    try {
        allChapters = await chapter_model_1.default.find({ course: courseId }, { _id: 1, order: 1, createdAt: 1 }).sort({ order: 1, createdAt: 1 }).session(session).hint({ course: 1, order: 1 });
    }
    catch (err) {
        const message = err?.message || '';
        const isBadHint = message.includes('hint provided does not correspond to an existing index');
        if (!isBadHint)
            throw err;
        allChapters = await chapter_model_1.default.find({ course: courseId }, { _id: 1, order: 1, createdAt: 1 }).sort({ order: 1, createdAt: 1 }).session(session);
    }
    const normalizeOps = allChapters.map((c, idx) => ({
        updateOne: {
            filter: { _id: c._id },
            update: { $set: { order: idx + 1 } }
        }
    }));
    if (normalizeOps.length) {
        await chapter_model_1.default.bulkWrite(normalizeOps, { session, ordered: false, writeConcern: { w: 1 } });
    }
    return allChapters.map((c, idx) => ({
        itemId: c._id.toString(),
        itemType: 'chapter',
        newOrder: idx + 1
    }));
};
exports.reorderCourseChaptersSimple = reorderCourseChaptersSimple;
/**
 * Validates that a chapter exists and belongs to the specified course
 *
 * @param chapterId - The chapter ID to validate
 * @param courseId - The expected course ID
 * @param session - MongoDB session for transaction support
 * @returns Promise<Chapter> - The validated chapter document
 * @throws AppError if chapter not found or doesn't belong to course
 */
const validateChapterBelongsToCourse = async (chapterId, courseId, session) => {
    const chapter = await chapter_model_1.default.findById(chapterId).session(session || null);
    if (!chapter || chapter.course.toString() !== courseId) {
        throw (0, errorHandler_1.createError)("Chapter not found or does not belong to the specified course.", 404);
    }
    return chapter;
};
exports.validateChapterBelongsToCourse = validateChapterBelongsToCourse;
//# sourceMappingURL=chapterReorder.js.map