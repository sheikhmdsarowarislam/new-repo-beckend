import { IDiscussion } from "./discussion.model";
import { ServiceResponse } from "../../@types/api";
/**
 * Create discussion
 */
export declare const createDiscussionService: (userId: string, lectureId: string, question: string) => Promise<ServiceResponse<IDiscussion>>;
/**
 * Answer question
 */
export declare const answerQuestionService: (discussionId: string, userId: string, text: string, isInstructor?: boolean) => Promise<ServiceResponse<IDiscussion>>;
/**
 * Update discussion
 */
export declare const updateDiscussionService: (discussionId: string, userId: string, question: string, userRole?: string) => Promise<ServiceResponse<IDiscussion>>;
/**
 * Delete discussion
 */
export declare const deleteDiscussionService: (discussionId: string, userId: string, userRole?: string) => Promise<ServiceResponse<any>>;
/**
 * Get discussion by ID with caching
 */
export declare const getDiscussionByIdService: (id: string) => Promise<ServiceResponse<any>>;
/**
 * Get lecture discussions (no caching)
 */
export declare const getLectureDiscussionsService: (lectureId: string, options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get course discussions (no caching)
 */
export declare const getCourseDiscussionsService: (courseId: string, options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get user discussions (no caching)
 */
export declare const getUserDiscussionsService: (userId: string, options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get all discussions from user's enrolled courses
 */
export declare const getEnrolledCoursesDiscussionsService: (userId: string, options?: any) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=discussion.service.d.ts.map