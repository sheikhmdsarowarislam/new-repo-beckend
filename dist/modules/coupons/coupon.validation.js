"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCouponSchema = exports.deleteCouponSchema = exports.updateCouponSchema = exports.createCouponSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = require("mongoose");
// Schema for creating a new coupon (Admin only)
const objectIdSchema = zod_1.z.string().refine(mongoose_1.Types.ObjectId.isValid, {
    message: "Invalid courseId format. Must be a 24-character hex string.",
});
exports.createCouponSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().min(4, 'Coupon code must be at least 4 characters.').toUpperCase(),
        discountValue: zod_1.z.number().min(1, 'Discount must be at least 1.').max(100, 'Discount cannot exceed 100.'),
        // Allows either 'all' (string literal) or a valid Course ObjectId
        appliesTo: zod_1.z.union([zod_1.z.literal('all'), objectIdSchema]).default('all'),
        expiresAt: zod_1.z.string().datetime('Invalid date format. Must be a valid date string.').optional(),
        usageLimit: zod_1.z.number().int('Usage limit must be an integer.').min(1, 'Usage limit must be positive.').optional(),
    }),
});
exports.updateCouponSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema, // Required route parameter
    }),
    body: zod_1.z.object({
        code: zod_1.z.string().min(4, 'Code must be at least 4 characters.').toUpperCase().optional(),
        discountValue: zod_1.z.number().min(1).max(100).optional(),
        appliesTo: zod_1.z.union([zod_1.z.literal('all'), objectIdSchema]).optional(),
        expiresAt: zod_1.z.string().datetime().optional(),
        isActive: zod_1.z.boolean().optional(),
        usageLimit: zod_1.z.number().int().min(1).optional(),
    }),
});
// Schema for deleting a coupon (Admin only)
exports.deleteCouponSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema,
    }),
});
exports.validateCouponSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema, // from req.params.id
    }),
    body: zod_1.z.object({
        couponCode: zod_1.z.string().min(1, "Coupon code is required."),
    }),
});
//# sourceMappingURL=coupon.validation.js.map