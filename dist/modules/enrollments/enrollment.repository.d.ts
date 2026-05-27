import { ClientSession } from 'mongoose';
import { IEnrollment } from './enrollment.model';
export declare const findEnrollmentById: (enrollmentId: string, session?: ClientSession) => Promise<any>;
export declare const findEnrollmentByStudentAndCourse: (studentId: string, courseId: string, session?: ClientSession) => Promise<any>;
export declare const findEnrollmentsByStudent: (studentId: string, session?: ClientSession) => Promise<any[]>;
export declare const findEnrollmentsByCourse: (courseId: string, session?: ClientSession) => Promise<any[]>;
export declare const createEnrollment: (data: Partial<IEnrollment>, session?: ClientSession) => Promise<IEnrollment>;
export declare const getEnrollmentStats: (courseIds: string[]) => Promise<any[]>;
export declare const checkMultipleEnrollments: (studentId: string, courseIds: string[]) => Promise<any[]>;
//# sourceMappingURL=enrollment.repository.d.ts.map