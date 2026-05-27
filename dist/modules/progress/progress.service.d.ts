import { ServiceResponse } from "../../@types/api";
export declare const updateLectureProgress: (userId: string, lectureId: string, progressPercentage: number) => Promise<ServiceResponse<any>>;
export declare const getCourseProgressService: (userId: string, courseId: string) => Promise<ServiceResponse<any>>;
export declare const getUserDashboard: (userId: string) => Promise<ServiceResponse<any>>;
export declare const generateCertificate: (userId: string, courseId: string) => Promise<ServiceResponse<any>>;
export declare const updateQuizProgress: (userId: string, quizId: string, score: number, courseId: string) => Promise<ServiceResponse<any>>;
export declare const getCourseCompletionStats: (courseId: string) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=progress.service.d.ts.map