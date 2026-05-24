// src/modules/coupons/coupon.service.ts

import { AppError } from "../../utils/errorHandler";
import Coupon from "./coupon.model";
import Course from "../courses/course.model";
import { ServiceResponse } from "../../@types/api";
import { Types } from "mongoose";

// Validate coupon
export const validateCoupon = async (code: string, courseId: string): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use lean query for better performance
    const coupon = await Coupon.findOne({ 
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
  } catch (error: any) {
    return {
      success: false,
      message: 'Coupon validation failed',
      errors: [error.message]
    };
  }
};

// Apply coupon to course
export const applyCoupon = async (couponId: string, courseId: string): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use parallel queries with lean for better performance
    const [coupon, course] = await Promise.all([
      Coupon.findById(couponId).lean(),
      Course.findById(courseId).lean()
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
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to apply coupon',
      errors: [error.message]
    };
  }
};

// Use coupon (increment usage count)
export const useCoupon = async (couponId: string): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use lean query for better performance
    const coupon = await Coupon.findByIdAndUpdate(
      couponId,
      { $inc: { usageCount: 1 } },
      { new: true, lean: true }
    );

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
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to update coupon usage',
      errors: [error.message]
    };
  }
};

// Create coupon
export const createCoupon = async (couponData: any): Promise<ServiceResponse<any>> => {
  try {
    const coupon = new Coupon(couponData);
    await coupon.save();
    
    return {
      success: true,
      data: coupon,
      message: 'Coupon created successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Coupon creation failed',
      errors: [error.message]
    };
  }
};

// Get all coupons
export const getAllCoupons = async (): Promise<ServiceResponse<any>> => {
  try {
    // Simply return all coupons as-is
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    
    return {
      success: true,
      data: coupons,
      message: 'Coupons retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve coupons',
      errors: [error.message]
    };
  }
};

// Get coupon by ID
export const getCouponById = async (couponId: string): Promise<ServiceResponse<any>> => {
  try {
    // Simply return coupon as-is
    const coupon = await Coupon.findById(couponId).lean();
    
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
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve coupon',
      errors: [error.message]
    };
  }
};

// Update coupon
export const updateCoupon = async (couponId: string, updateData: any): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use lean query for better performance
    const coupon = await Coupon.findByIdAndUpdate(couponId, updateData, { new: true, lean: true });
    
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
  } catch (error: any) {
    return {
      success: false,
      message: 'Coupon update failed',
      errors: [error.message]
    };
  }
};

// Delete coupon
export const deleteCoupon = async (couponId: string): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use lean query for better performance
    const coupon = await Coupon.findByIdAndDelete(couponId).lean();
    
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
  } catch (error: any) {
    return {
      success: false,
      message: 'Coupon deletion failed',
      errors: [error.message]
    };
  }
};

// Get active coupons
export const getActiveCoupons = async (): Promise<ServiceResponse<any>> => {
  try {
    // OPTIMIZATION: Use lean query for better performance
    const coupons = await Coupon.find({ 
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
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve active coupons',
      errors: [error.message]
    };
  }
};