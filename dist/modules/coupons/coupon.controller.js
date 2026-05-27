"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCouponController = exports.deleteCouponController = exports.updateCouponController = exports.getAllCouponsController = exports.createCouponController = void 0;
const catchAsync_1 = require("../../middlewares/catchAsync");
const coupon_service_1 = require("./coupon.service");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// Controller for creating a new coupon
exports.createCouponController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can create coupons
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const result = await (0, coupon_service_1.createCoupon)(req.body);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Coupon creation failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, result.data, 'Coupon created successfully');
});
// Controller for getting all coupons
exports.getAllCouponsController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can view all coupons
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const result = await (0, coupon_service_1.getAllCoupons)();
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve coupons', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Coupons retrieved successfully');
});
// update coupon controller
exports.updateCouponController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can update coupons
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const couponId = req.params.id;
    if (!couponId) {
        return (0, response_1.sendError)(res, 'Coupon ID missing', 400);
    }
    const result = await (0, coupon_service_1.updateCoupon)(couponId, req.body);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Coupon update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Coupon updated successfully');
});
// Controller for deleting a coupon
exports.deleteCouponController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can delete coupons
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const { id } = req.params;
    if (!id) {
        return (0, response_1.sendError)(res, 'Coupon ID missing', 400);
    }
    const result = await (0, coupon_service_1.deleteCoupon)(id);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Coupon deletion failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, undefined, 'Coupon deleted successfully');
});
exports.validateCouponController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const courseId = req.params.id;
    const { couponCode } = req.body;
    if (!courseId) {
        return (0, response_1.sendError)(res, 'Course ID missing', 400);
    }
    if (!couponCode) {
        return (0, response_1.sendError)(res, 'Coupon code missing', 400);
    }
    const result = await (0, coupon_service_1.validateCoupon)(couponCode, courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Coupon validation failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Coupon validated successfully');
});
//# sourceMappingURL=coupon.controller.js.map