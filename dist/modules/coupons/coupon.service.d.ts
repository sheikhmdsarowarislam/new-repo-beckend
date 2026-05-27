import { ServiceResponse } from "../../@types/api";
export declare const validateCoupon: (code: string, courseId: string) => Promise<ServiceResponse<any>>;
export declare const applyCoupon: (couponId: string, courseId: string) => Promise<ServiceResponse<any>>;
export declare const useCoupon: (couponId: string) => Promise<ServiceResponse<any>>;
export declare const createCoupon: (couponData: any) => Promise<ServiceResponse<any>>;
export declare const getAllCoupons: () => Promise<ServiceResponse<any>>;
export declare const getCouponById: (couponId: string) => Promise<ServiceResponse<any>>;
export declare const updateCoupon: (couponId: string, updateData: any) => Promise<ServiceResponse<any>>;
export declare const deleteCoupon: (couponId: string) => Promise<ServiceResponse<any>>;
export declare const getActiveCoupons: () => Promise<ServiceResponse<any>>;
//# sourceMappingURL=coupon.service.d.ts.map