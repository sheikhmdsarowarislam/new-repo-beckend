import { Types } from "mongoose";
import { ServiceResponse } from "../../@types/api";
type CourseQueryOptions = {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    level?: string;
};
export declare const updateCourseDuration: (courseId: string, newDuration?: number, session?: any) => Promise<void>;
export declare const createCourse: (courseData: any, instructorId: string) => Promise<ServiceResponse<any>>;
export declare const updateCourse: (courseId: string, updateData: any, instructorId: string, instructorRole: string) => Promise<ServiceResponse<any>>;
export declare const deleteCourse: (courseId: string, instructorId: string, instructorRole: string) => Promise<ServiceResponse<null>>;
export declare const getAllCoursesService: (options: CourseQueryOptions, cacheKey?: string) => Promise<ServiceResponse<{
    data: any[];
    pagination: any;
}>>;
export declare const checkEnrollmentStatus: (courseId: string, userId: string) => Promise<boolean>;
export declare const getCourseDetails: (courseId: string, userId?: string, cacheKey?: string) => Promise<ServiceResponse<any>>;
export declare const searchCourses: (filters: {
    category?: string;
    level?: string;
    priceRange?: {
        min: number;
        max: number;
    };
    rating?: number;
    instructor?: string;
    search?: string;
}) => Promise<(import("mongoose").Document<unknown, {}, import("./course.model").ICourse, {}, {}> & import("./course.model").ICourse & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
})[]>;
export declare const getRecommendedCourses: (userId: string) => Promise<ServiceResponse<any[]>>;
export declare const getCourseAnalytics: (courseId: string) => Promise<ServiceResponse<any>>;
export declare const getFeaturedCourses: (limit?: number) => Promise<ServiceResponse<any[]>>;
export declare const getCoursesByInstructor: (instructorId: string) => Promise<ServiceResponse<any[]>>;
export declare const getCourseStats: (courseId: string) => Promise<ServiceResponse<any>>;
export {};
//# sourceMappingURL=course.service.d.ts.map