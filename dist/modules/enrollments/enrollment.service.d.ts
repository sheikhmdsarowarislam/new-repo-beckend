import { ICoupon } from "../coupons/coupon.model";
import { ServiceResponse } from "../../@types/api";
export declare const submitManualPayment: ({ studentId, courseId, transactionId, couponCode, }: {
    studentId: string;
    courseId: string;
    transactionId: string;
    couponCode?: string;
}) => Promise<ServiceResponse<any>>;
export declare const approveEnrollment: (enrollmentId: string, adminId: string, validityDays?: number) => Promise<ServiceResponse<any>>;
export declare const rejectEnrollment: (enrollmentId: string, adminId: string, reason?: string) => Promise<ServiceResponse<any>>;
export declare const getPendingEnrollments: () => Promise<ServiceResponse<any>>;
export declare const processEnrollment: ({ studentId, courseId, amountPaid, paymentStatus, paymentMethod, couponId, }: {
    studentId: string;
    courseId: string;
    amountPaid: number;
    paymentStatus: "paid" | "free";
    paymentMethod?: "bkash" | "free" | "stripe";
    couponId?: string;
}) => Promise<ServiceResponse<any>>;
export declare const calculateFinalPrice: (courseId: string, couponCode?: string) => Promise<ServiceResponse<{
    finalPrice: number;
    coupon: ICoupon | null;
    course: any;
}>>;
export declare const getEnrolledCoursesByUser: (userId: string) => Promise<ServiceResponse<any>>;
export declare const getEnrolledCourseDetails: (courseId: string, userId: string) => Promise<ServiceResponse<any>>;
export declare const checkEnrollmentStatus: (courseId: string, userId: string) => Promise<ServiceResponse<any>>;
export declare const getInstructorDashboardData: (instructorId: string) => Promise<ServiceResponse<any>>;
export declare const getStudentsByInstructor: (instructorId: string) => Promise<ServiceResponse<any>>;
export declare const submitToolPayment: ({ studentId, toolId, transactionId, variationDays, }: {
    studentId: string;
    toolId: string;
    transactionId: string;
    variationDays?: number;
}) => Promise<ServiceResponse<any>>;
export declare const checkToolEnrollmentStatus: (toolId: string, userId: string) => Promise<ServiceResponse<any>>;
export declare const getUserTools: (userId: string) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=enrollment.service.d.ts.map