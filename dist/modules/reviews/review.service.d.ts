import { IReview } from "./review.model";
import { ServiceResponse } from "../../@types/api";
/**
 * Create a new review
 */
export declare const createReviewService: (userId: string, courseId: string, rating: number, comment?: string) => Promise<ServiceResponse<IReview>>;
/**
 * Update review
 */
export declare const updateReviewService: (reviewId: string, userId: string, rating?: number, comment?: string) => Promise<ServiceResponse<IReview>>;
/**
 * Delete review
 */
export declare const deleteReviewService: (reviewId: string, userId: string) => Promise<ServiceResponse<any>>;
/**
 * Get review by ID
 */
export declare const getReviewByIdService: (id: string) => Promise<ServiceResponse<any>>;
/**
 * Get course reviews
 */
export declare const getCourseReviewsService: (courseId: string, options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get user reviews
 */
export declare const getUserReviewsService: (userId: string, options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get course review statistics
 */
export declare const getCourseReviewStatsService: (courseId: string) => Promise<ServiceResponse<any>>;
/**
 * Get all reviews for instructor's courses
 */
export declare const getInstructorReviewsService: (instructorId: string) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=review.service.d.ts.map