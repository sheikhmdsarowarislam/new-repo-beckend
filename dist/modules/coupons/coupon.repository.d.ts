import { ClientSession } from 'mongoose';
import { ICoupon } from './coupon.model';
export type CouponQueryOptions = {
    page?: number;
    limit?: number;
    isActive?: boolean;
    courseId?: string;
};
export declare const findCouponById: (couponId: string, session?: ClientSession) => Promise<any>;
export declare const findCouponByCode: (code: string, session?: ClientSession) => Promise<any>;
export declare const findActiveCoupons: (session?: ClientSession) => Promise<any[]>;
export declare const findCouponsByCourse: (courseId: string, session?: ClientSession) => Promise<any[]>;
export declare const findExpiredCoupons: (session?: ClientSession) => Promise<any[]>;
export declare const countActiveCoupons: (session?: ClientSession) => Promise<number>;
export declare const createCoupon: (data: Partial<ICoupon>, session?: ClientSession) => Promise<ICoupon>;
export declare const updateCouponById: (couponId: string, updateData: Partial<ICoupon>, session?: ClientSession) => Promise<ICoupon | null>;
export declare const incrementCouponUsage: (couponId: string, session?: ClientSession) => Promise<ICoupon | null>;
export declare const deleteCouponById: (couponId: string, session?: ClientSession) => Promise<ICoupon | null>;
export declare const bulkDeactivateExpiredCoupons: (session?: ClientSession) => Promise<void>;
export declare const bulkDeleteExpiredCoupons: (daysOld?: number, session?: ClientSession) => Promise<void>;
export declare const aggregateCouponStats: () => Promise<any>;
export declare const aggregateCouponUsageByPeriod: (period?: "day" | "week" | "month") => Promise<any>;
//# sourceMappingURL=coupon.repository.d.ts.map