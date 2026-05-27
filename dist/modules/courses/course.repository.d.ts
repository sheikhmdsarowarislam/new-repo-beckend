import { Types, ClientSession } from 'mongoose';
import { ICourse } from './course.model';
type CourseQueryOptions = {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    level?: string;
};
export declare const countCourses: (query: any) => Promise<number>;
export declare const findCourses: (query: any, options: CourseQueryOptions) => Promise<ICourse[]>;
export declare const findCourseById: (courseId: string, session?: ClientSession) => Promise<ICourse | null>;
export declare const aggregateCourseDetailsWithEnrollment: (courseId: string) => Promise<any>;
export declare const aggregateCourseDetails: (courseId: string) => Promise<any>;
export declare const createCourse: (data: any, session?: ClientSession) => Promise<ICourse>;
export declare const updateCourse: (courseId: string, updateData: any, session?: ClientSession) => Promise<ICourse | null>;
export declare const deleteCourseDependencies: (courseId: string, chapterIds: Types.ObjectId[], session: ClientSession) => Promise<void>;
export declare const deleteCourseById: (courseId: string, session: ClientSession) => Promise<ICourse | null>;
export {};
//# sourceMappingURL=course.repository.d.ts.map