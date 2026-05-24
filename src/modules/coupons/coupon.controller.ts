import { Response } from 'express';

import { AuthRequest } from '../../middlewares/auth';
import { catchAsync } from '../../middlewares/catchAsync';
import { createCoupon, deleteCoupon, getAllCoupons, updateCoupon, validateCoupon } from './coupon.service';
import { getUserId, getUserRole, getPaginationParams } from '../../utils/common';
import { sendSuccess, sendCreated, sendError, sendPaginated } from '../../utils/response';

// Controller for creating a new coupon
export const createCouponController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userRole = getUserRole(req);
  
  // Only admins can create coupons
  if (userRole !== 'admin') {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const result = await createCoupon(req.body);
  
  if (!result.success) {
    return sendError(res, result.message || 'Coupon creation failed', 400, result.errors);
  }
  
  return sendCreated(res, result.data, 'Coupon created successfully');
});

// Controller for getting all coupons
export const getAllCouponsController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userRole = getUserRole(req);
  
  // Only admins can view all coupons
  if (userRole !== 'admin') {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const result = await getAllCoupons();
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve coupons', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Coupons retrieved successfully');
});

// update coupon controller
export const updateCouponController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userRole = getUserRole(req);
  
  // Only admins can update coupons
  if (userRole !== 'admin') {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const couponId = req.params.id as string;
  if (!couponId) {
    return sendError(res, 'Coupon ID missing', 400);
  }

  const result = await updateCoupon(couponId, req.body);
  
  if (!result.success) {
    return sendError(res, result.message || 'Coupon update failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Coupon updated successfully');
});

// Controller for deleting a coupon
export const deleteCouponController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userRole = getUserRole(req);
  
  // Only admins can delete coupons
  if (userRole !== 'admin') {
    return sendError(res, 'Insufficient permissions', 403);
  }

  const { id } = req.params as {id: string};
  if (!id) {
    return sendError(res, 'Coupon ID missing', 400);
  }

  const result = await deleteCoupon(id);
  
  if (!result.success) {
    return sendError(res, result.message || 'Coupon deletion failed', 400, result.errors);
  }
  
  return sendSuccess(res, undefined, 'Coupon deleted successfully');
});

export const validateCouponController = catchAsync(async (req: any, res: Response) => {
  const courseId = req.params.id as string;
  const { couponCode } = req.body as { couponCode: string };

  if (!courseId) {
    return sendError(res, 'Course ID missing', 400);
  }

  if (!couponCode) {
    return sendError(res, 'Coupon code missing', 400);
  }

  const result = await validateCoupon(couponCode, courseId);

  if (!result.success) {
    return sendError(res, result.message || 'Coupon validation failed', 400, result.errors);
  }

  return sendSuccess(res, result.data, 'Coupon validated successfully');
});
