import { z } from 'zod';
import { Types } from 'mongoose';
// Schema for creating a new coupon (Admin only)
const objectIdSchema = z.string().refine(Types.ObjectId.isValid, {
  message: "Invalid courseId format. Must be a 24-character hex string.",
});
  
export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(4, 'Coupon code must be at least 4 characters.').toUpperCase(),
    discountValue: z.number().min(1, 'Discount must be at least 1.').max(100, 'Discount cannot exceed 100.'),
    // Allows either 'all' (string literal) or a valid Course ObjectId
    appliesTo: z.union([z.literal('all'), objectIdSchema]).default('all'),
    expiresAt: z.string().datetime('Invalid date format. Must be a valid date string.').optional(),
    usageLimit: z.number().int('Usage limit must be an integer.').min(1, 'Usage limit must be positive.').optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: objectIdSchema, // Required route parameter
  }),
  body: z.object({
    code: z.string().min(4, 'Code must be at least 4 characters.').toUpperCase().optional(),
    discountValue: z.number().min(1).max(100).optional(),
    appliesTo: z.union([z.literal('all'), objectIdSchema]).optional(),
    expiresAt: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    usageLimit: z.number().int().min(1).optional(),
  }),
});

// Schema for deleting a coupon (Admin only)
export const deleteCouponSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});



export const validateCouponSchema = z.object({
  params: z.object({
    id: objectIdSchema, // from req.params.id
  }),
  body: z.object({
    couponCode: z.string().min(1, "Coupon code is required."),
  }),
});