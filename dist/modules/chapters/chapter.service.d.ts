import { IChapter } from "./chapter.model";
import { ServiceResponse } from "../../@types/api";
export type ICreateChapterData = {
    title: string;
    course: string;
    order?: number;
};
export type IUpdateChapterData = {
    title?: string;
    order?: number;
};
export type UserRole = 'admin' | 'instructor' | 'student';
export declare const updateChapterDuration: (chapterId: string, session?: any) => Promise<void>;
export declare const createChapter: (data: ICreateChapterData, userId: string, userRole: UserRole) => Promise<ServiceResponse<IChapter>>;
/**
 * Update Chapter (title / order) - OPTIMIZED VERSION
 * Reduces database calls by optimizing validation and reordering
 */
export declare const updateChapter: (id: string, data: IUpdateChapterData, userId: string, userRole: UserRole) => Promise<ServiceResponse<IChapter>>;
export declare const deleteChapterService: (chapterId: string, userId: string, userRole: UserRole) => Promise<ServiceResponse<IChapter>>;
/**
 * Reorder Chapters Only - SIMPLIFIED VERSION
 * Simple and efficient chapter reordering without lecture complexity
 */
export declare const reorderChapters: (courseId: string, orderList: {
    chapterId: string;
    order: number;
}[], userId: string, userRole: UserRole) => Promise<ServiceResponse<boolean>>;
export declare const getChaptersByCourse: (courseId: string, cacheKey?: string) => Promise<ServiceResponse<any>>;
/**
 * Reorder content (lectures and quizzes) within a chapter
 */
export declare const reorderChapterContent: (chapterId: string, items: {
    itemId: string;
    itemType: "lecture" | "quiz";
    order: number;
}[]) => Promise<ServiceResponse<any>>;
/**
 * Get Single Chapter (IMPLEMENTING CACHING)
 */
export declare const getChapterById: (id: string) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=chapter.service.d.ts.map