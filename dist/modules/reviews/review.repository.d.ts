import { ClientSession } from 'mongoose';
import { IReview } from './review.model';
export declare const findReviewById: (reviewId: string, session?: ClientSession) => Promise<IReview | null>;
export declare const findReviewByUserAndCourse: (userId: string, courseId: string, session?: ClientSession) => Promise<IReview | null>;
export declare const findReviewsByCourse: (courseId: string, options?: any, session?: ClientSession) => Promise<IReview[]>;
export declare const findReviewsByUser: (userId: string, options?: any, session?: ClientSession) => Promise<IReview[]>;
export declare const countReviewsByCourse: (courseId: string, session?: ClientSession) => Promise<number>;
export declare const countReviewsByUser: (userId: string, session?: ClientSession) => Promise<number>;
export declare const createReview: (data: Partial<IReview>, session?: ClientSession) => Promise<IReview>;
export declare const updateReviewById: (reviewId: string, updateData: Partial<IReview>, session?: ClientSession) => Promise<IReview | null>;
export declare const deleteReviewById: (reviewId: string, session?: ClientSession) => Promise<IReview | null>;
export declare const bulkDeleteReviewsByCourse: (courseId: string, session?: ClientSession) => Promise<void>;
export declare const bulkDeleteReviewsByUser: (userId: string, session?: ClientSession) => Promise<void>;
export declare const aggregateCourseReviewStats: (courseId: string) => Promise<any>;
//# sourceMappingURL=review.repository.d.ts.map