import { ICreateQuizBody, IUpdateQuizBody, ISubmitQuizAttemptBody } from "./quiz.validation";
import { ServiceResponse } from "../../@types/api";
import { IQuiz } from './quiz.model';
/**
 * Create a new quiz with smart order conflict resolution
 * Similar to createLectureLogic but functional with proper error handling
 */
export declare const createQuizService: (data: ICreateQuizBody, userId: string, userRole: string) => Promise<ServiceResponse<IQuiz>>;
/**
 * Update quiz with smart order conflict resolution
 */
export declare const updateQuizService: (id: string, data: IUpdateQuizBody, userId: string, userRole: string) => Promise<ServiceResponse<IQuiz>>;
/**
 * Delete quiz
 */
export declare const deleteQuizService: (id: string, userId: string, userRole: string) => Promise<ServiceResponse<IQuiz>>;
/**
 * Get quiz by ID with simple enrollment check
 */
export declare const getQuizByIdService: (id: string, cacheKey: string, userId: string, userRole: string) => Promise<ServiceResponse<any>>;
/**
 * Submit quiz attempt with simple enrollment check
 */
export declare const submitQuizAttemptService: (userId: string, quizId: string, data: ISubmitQuizAttemptBody) => Promise<ServiceResponse<any>>;
/**
 * Get quiz results for a course with simple enrollment check
 */
export declare const getQuizResultsService: (userId: string, courseId: string, cacheKey?: string) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=quiz.service.d.ts.map