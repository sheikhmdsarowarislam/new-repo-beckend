"use strict";
// src/modules/coupons/coupon.service.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveCoupons = exports.deleteCoupon = exports.updateCoupon = exports.getCouponById = exports.getAllCoupons = exports.createCoupon = exports.useCoupon = exports.applyCoupon = exports.validateCoupon = void 0;
const coupon_model_1 = __importDefault(require("./coupon.model"));
const course_model_1 = __importDefault(require("../courses/course.model"));
// Validate coupon
const validateCoupon = async (code, courseId) => {
    try {
        // OPTIMIZATION: Use lean query for better performance
        const coupon = await coupon_model_1.default.findOne({
            code: code.toUpperCase(),
            isActive: true
        }).lean();
        if (!coupon) {
            return {
                success: false,
                message: 'Invalid coupon code',
                errors: ['No active coupon found with the provided code']
            };
        }
        // Check expiration
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
            return {
                success: false,
                message: 'Coupon has expired',
                errors: ['The coupon code has expired']
            };
        }
        // Check usage limit
        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return {
                success: false,
                message: 'Coupon usage limit exceeded',
                errors: ['The coupon has reached its maximum usage limit']
            };
        }
        // Check if applies to course
        if (coupon.appliesTo !== 'all' && coupon.appliesTo.toString() !== courseId) {
            return {
                success: false,
                message: 'Coupon not valid for this course',
                errors: ['This coupon is not valid for the selected course']
            };
        }
        return {
            success: true,
            data: coupon,
            message: 'Coupon validated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Coupon validation failed',
            errors: [error.message]
        };
    }
};
exports.validateCoupon = validateCoupon;
// Apply coupon to course
const applyCoupon = async (couponId, courseId) => {
    try {
        // OPTIMIZATION: Use parallel queries with lean for better performance
        const [coupon, course] = await Promise.all([
            coupon_model_1.default.findById(couponId).lean(),
            course_model_1.default.findById(courseId).lean()
        ]);
        if (!coupon || !course) {
            return {
                success: false,
                message: 'Invalid coupon or course',
                errors: ['Coupon or course not found']
            };
        }
        let discountAmount = 0;
        // For simplicity, treat discountValue as percentage (1-100)
        // If you need fixed amount discounts, add a separate field like discountType: 'percentage' | 'fixed'
        discountAmount = (course.price * coupon.discountValue) / 100;
        const finalPrice = Math.max(0, course.price - discountAmount);
        return {
            success: true,
            data: {
                originalPrice: course.price,
                discountAmount: Math.round(discountAmount),
                finalPrice: Math.round(finalPrice),
                coupon: coupon.code,
                savings: Math.round(course.price - finalPrice)
            },
            message: 'Coupon applied successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to apply coupon',
            errors: [error.message]
        };
    }
};
exports.applyCoupon = applyCoupon;
// Use coupon (increment usage count)
const useCoupon = async (couponId) => {
    try {
        // OPTIMIZATION: Use lean query for better performance
        const coupon = await coupon_model_1.default.findByIdAndUpdate(couponId, { $inc: { usageCount: 1 } }, { new: true, lean: true });
        if (!coupon) {
            return {
                success: false,
                message: 'Coupon not found',
                errors: ['No coupon found with the provided ID']
            };
        }
        return {
            success: true,
            data: coupon,
            message: 'Coupon usage count updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to update coupon usage',
            errors: [error.message]
        };
    }
};
exports.useCoupon = useCoupon;
// Create coupon
const createCoupon = async (couponData) => {
    try {
        const coupon = new coupon_model_1.default(couponData);
        await coupon.save();
        return {
            success: true,
            data: coupon,
            message: 'Coupon created successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Coupon creation failed',
            errors: [error.message]
        };
    }
};
exports.createCoupon = createCoupon;
// Get all coupons
const getAllCoupons = async () => {
    try {
        // Simply return all coupons as-is
        const coupons = await coupon_model_1.default.find().sort({ createdAt: -1 }).lean();
        return {
            success: true,
            data: coupons,
            message: 'Coupons retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve coupons',
            errors: [error.message]
        };
    }
};
exports.getAllCoupons = getAllCoupons;
// Get coupon by ID
const getCouponById = async (couponId) => {
    try {
        // Simply return coupon as-is
        const coupon = await coupon_model_1.default.findById(couponId).lean();
        if (!coupon) {
            return {
                success: false,
                message: 'Coupon not found',
                errors: ['No coupon found with the provided ID']
            };
        }
        return {
            success: true,
            data: coupon,
            message: 'Coupon retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve coupon',
            errors: [error.message]
        };
    }
};
exports.getCouponById = getCouponById;
// Update coupon
const updateCoupon = async (couponId, updateData) => {
    try {
        // OPTIMIZATION: Use lean query for better performance
        const coupon = await coupon_model_1.default.findByIdAndUpdate(couponId, updateData, { new: true, lean: true });
        if (!coupon) {
            return {
                success: false,
                message: 'Coupon not found',
                errors: ['No coupon found with the provided ID']
            };
        }
        return {
            success: true,
            data: coupon,
            message: 'Coupon updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Coupon update failed',
            errors: [error.message]
        };
    }
};
exports.updateCoupon = updateCoupon;
// Delete coupon
const deleteCoupon = async (couponId) => {
    try {
        // OPTIMIZATION: Use lean query for better performance
        const coupon = await coupon_model_1.default.findByIdAndDelete(couponId).lean();
        if (!coupon) {
            return {
                success: false,
                message: 'Coupon not found',
                errors: ['No coupon found with the provided ID']
            };
        }
        return {
            success: true,
            data: coupon,
            message: 'Coupon deleted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Coupon deletion failed',
            errors: [error.message]
        };
    }
};
exports.deleteCoupon = deleteCoupon;
// Get active coupons
const getActiveCoupons = async () => {
    try {
        // OPTIMIZATION: Use lean query for better performance
        const coupons = await coupon_model_1.default.find({
            isActive: true,
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: new Date() } }
            ]
        }).sort({ createdAt: -1 }).lean();
        return {
            success: true,
            data: coupons,
            message: 'Active coupons retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve active coupons',
            errors: [error.message]
        };
    }
};
exports.getActiveCoupons = getActiveCoupons;
//# sourceMappingURL=coupon.service.js.map