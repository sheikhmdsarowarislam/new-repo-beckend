"use strict";
// src/modules/coupons/coupon.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregateCouponUsageByPeriod = exports.aggregateCouponStats = exports.bulkDeleteExpiredCoupons = exports.bulkDeactivateExpiredCoupons = exports.deleteCouponById = exports.incrementCouponUsage = exports.updateCouponById = exports.createCoupon = exports.countActiveCoupons = exports.findExpiredCoupons = exports.findCouponsByCourse = exports.findActiveCoupons = exports.findCouponByCode = exports.findCouponById = void 0;
const coupon_model_1 = __importDefault(require("./coupon.model"));
// --- READ Operations ---
const findCouponById = (couponId, session) => {
    return coupon_model_1.default.findById(couponId)
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findCouponById = findCouponById;
const findCouponByCode = (code, session) => {
    return coupon_model_1.default.findOne({ code: code.toUpperCase() })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findCouponByCode = findCouponByCode;
const findActiveCoupons = (session) => {
    const now = new Date();
    return coupon_model_1.default.find({
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        usageCount: { $lt: "$maxUsage" }
    })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findActiveCoupons = findActiveCoupons;
const findCouponsByCourse = (courseId, session) => {
    return coupon_model_1.default.find({
        $or: [
            { applicableCourses: courseId },
            { applicableCourses: { $size: 0 } } // Global coupons
        ]
    })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findCouponsByCourse = findCouponsByCourse;
const findExpiredCoupons = (session) => {
    const now = new Date();
    return coupon_model_1.default.find({
        $or: [
            { validUntil: { $lt: now } },
            { usageCount: { $gte: "$maxUsage" } }
        ]
    })
        .lean() // OPTIMIZATION: Use lean for better performance
        .session(session || null);
};
exports.findExpiredCoupons = findExpiredCoupons;
const countActiveCoupons = (session) => {
    const now = new Date();
    return coupon_model_1.default.countDocuments({
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        usageCount: { $lt: "$maxUsage" }
    }).session(session || null);
};
exports.countActiveCoupons = countActiveCoupons;
// --- WRITE Operations ---
const createCoupon = (data, session) => {
    return coupon_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create coupon document.");
        }
        return res[0];
    });
};
exports.createCoupon = createCoupon;
const updateCouponById = (couponId, updateData, session) => {
    return coupon_model_1.default.findByIdAndUpdate(couponId, updateData, {
        new: true,
        runValidators: true
    }).session(session || null);
};
exports.updateCouponById = updateCouponById;
const incrementCouponUsage = (couponId, session) => {
    return coupon_model_1.default.findByIdAndUpdate(couponId, { $inc: { usageCount: 1 } }, { new: true }).session(session || null);
};
exports.incrementCouponUsage = incrementCouponUsage;
const deleteCouponById = (couponId, session) => {
    return coupon_model_1.default.findByIdAndDelete(couponId).session(session || null);
};
exports.deleteCouponById = deleteCouponById;
// --- BULK Operations ---
const bulkDeactivateExpiredCoupons = async (session) => {
    const now = new Date();
    await coupon_model_1.default.updateMany({
        $or: [
            { validUntil: { $lt: now } },
            { usageCount: { $gte: "$maxUsage" } }
        ]
    }, { $set: { isActive: false } }).session(session || null);
};
exports.bulkDeactivateExpiredCoupons = bulkDeactivateExpiredCoupons;
const bulkDeleteExpiredCoupons = async (daysOld = 30, session) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    await coupon_model_1.default.deleteMany({
        validUntil: { $lt: cutoffDate },
        isActive: false
    }).session(session || null);
};
exports.bulkDeleteExpiredCoupons = bulkDeleteExpiredCoupons;
// --- AGGREGATION Operations ---
const aggregateCouponStats = async () => {
    // OPTIMIZATION: Enhanced aggregation pipeline with better performance
    return coupon_model_1.default.aggregate([
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
exports.aggregateCouponStats = aggregateCouponStats;
const aggregateCouponUsageByPeriod = async (period = 'month') => {
    const groupBy = {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        week: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
        month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
    };
    return coupon_model_1.default.aggregate([
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
exports.aggregateCouponUsageByPeriod = aggregateCouponUsageByPeriod;
//# sourceMappingURL=coupon.repository.js.map