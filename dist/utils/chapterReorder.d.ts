export interface ReorderResult {
    itemId: string;
    itemType: 'chapter';
    newOrder: number;
}
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
export declare const reorderCourseChaptersWithConflictResolution: (courseId: string, orderList: {
    chapterId: string;
    order: number;
}[], session: any) => Promise<ReorderResult[]>;
/**
 * Extremely simple reorder: apply provided orders, then normalize all orders to 1..n
 * within the course by current (order ASC, createdAt ASC).
 * This avoids complex conflict handling and guarantees a contiguous order.
 */
export declare const reorderCourseChaptersSimple: (courseId: string, orderList: {
    chapterId: string;
    order: number;
}[], session: any) => Promise<ReorderResult[]>;
/**
 * Validates that a chapter exists and belongs to the specified course
 *
 * @param chapterId - The chapter ID to validate
 * @param courseId - The expected course ID
 * @param session - MongoDB session for transaction support
 * @returns Promise<Chapter> - The validated chapter document
 * @throws AppError if chapter not found or doesn't belong to course
 */
export declare const validateChapterBelongsToCourse: (chapterId: string, courseId: string, session?: any) => Promise<any>;
//# sourceMappingURL=chapterReorder.d.ts.map