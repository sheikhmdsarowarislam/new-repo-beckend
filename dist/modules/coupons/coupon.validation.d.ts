import { z } from 'zod';
export declare const createCouponSchema: z.ZodObject<{
    body: z.ZodObject<{
        code: z.ZodString;
        discountValue: z.ZodNumber;
        appliesTo: z.ZodDefault<z.ZodUnion<readonly [z.ZodLiteral<"all">, z.ZodString]>>;
        expiresAt: z.ZodOptional<z.ZodString>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateCouponSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        code: z.ZodOptional<z.ZodString>;
        discountValue: z.ZodOptional<z.ZodNumber>;
        appliesTo: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"all">, z.ZodString]>>;
        expiresAt: z.ZodOptional<z.ZodString>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        usageLimit: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const deleteCouponSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const validateCouponSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        couponCode: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=coupon.validation.d.ts.map