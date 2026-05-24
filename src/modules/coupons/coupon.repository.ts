// src/modules/coupons/coupon.repository.ts

import mongoose, { Types, ClientSession } from 'mongoose';
import Coupon, { ICoupon } from './coupon.model';

// --- Types ---
export type CouponQueryOptions = {
  page?: number;
  limit?: number;
  isActive?: boolean;
  courseId?: string;
};

// --- READ Operations ---

export const findCouponById = (couponId: string, session?: ClientSession): Promise<any> => {
  return Coupon.findById(couponId)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findCouponByCode = (code: string, session?: ClientSession): Promise<any> => {
  return Coupon.findOne({ code: code.toUpperCase() })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findActiveCoupons = (session?: ClientSession): Promise<any[]> => {
  const now = new Date();
  return Coupon.find({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    usageCount: { $lt: "$maxUsage" }
  })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findCouponsByCourse = (courseId: string, session?: ClientSession): Promise<any[]> => {
  return Coupon.find({ 
    $or: [
      { applicableCourses: courseId },
      { applicableCourses: { $size: 0 } } // Global coupons
    ]
  })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findExpiredCoupons = (session?: ClientSession): Promise<any[]> => {
  const now = new Date();
  return Coupon.find({
    $or: [
      { validUntil: { $lt: now } },
      { usageCount: { $gte: "$maxUsage" } }
    ]
  })
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const countActiveCoupons = (session?: ClientSession): Promise<number> => {
  const now = new Date();
  return Coupon.countDocuments({
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    usageCount: { $lt: "$maxUsage" }
  }).session(session || null);
};

// --- WRITE Operations ---

export const createCoupon = (data: Partial<ICoupon>, session?: ClientSession): Promise<ICoupon> => {
  return Coupon.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create coupon document.");
    }
    return res[0]!;
  });
};

export const updateCouponById = (
  couponId: string, 
  updateData: Partial<ICoupon>, 
  session?: ClientSession
): Promise<ICoupon | null> => {
  return Coupon.findByIdAndUpdate(couponId, updateData, { 
    new: true, 
    runValidators: true 
  }).session(session || null);
};

export const incrementCouponUsage = (
  couponId: string, 
  session?: ClientSession
): Promise<ICoupon | null> => {
  return Coupon.findByIdAndUpdate(
    couponId, 
    { $inc: { usageCount: 1 } }, 
    { new: true }
  ).session(session || null);
};

export const deleteCouponById = (couponId: string, session?: ClientSession): Promise<ICoupon | null> => {
  return Coupon.findByIdAndDelete(couponId).session(session || null);
};

// --- BULK Operations ---

export const bulkDeactivateExpiredCoupons = async (session?: ClientSession): Promise<void> => {
  const now = new Date();
  await Coupon.updateMany(
    {
      $or: [
        { validUntil: { $lt: now } },
        { usageCount: { $gte: "$maxUsage" } }
      ]
    },
    { $set: { isActive: false } }
  ).session(session || null);
};

export const bulkDeleteExpiredCoupons = async (daysOld: number = 30, session?: ClientSession): Promise<void> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  await Coupon.deleteMany({
    validUntil: { $lt: cutoffDate },
    isActive: false
  }).session(session || null);
};

// --- AGGREGATION Operations ---

export const aggregateCouponStats = async (): Promise<any> => {
  // OPTIMIZATION: Enhanced aggregation pipeline with better performance
  return Coupon.aggregate([
    {
      $group: {
        _id: null,
        totalCoupons: { $sum: 1 },
        activeCoupons: { 
          $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } 
        },
        totalUsage: { $sum: { $ifNull: ["$usageCount", 0] } },
        averageDiscount: { $avg: { $ifNull: ["$discountValue", 0] } }
      }
    },
    {
      $addFields: {
        averageDiscount: { $round: [{ $ifNull: ["$averageDiscount", 0] }, 2] }
      }
    }
  ]);
};

export const aggregateCouponUsageByPeriod = async (period: 'day' | 'week' | 'month' = 'month'): Promise<any> => {
  const groupBy = {
    day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
    week: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
    month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
  };

  return Coupon.aggregate([
    {
      $group: {
        _id: groupBy[period],
        couponsCreated: { $sum: 1 },
        totalUsage: { $sum: "$usageCount" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};
