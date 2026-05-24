// src/modules/users/user.controller.ts

import { Request, Response } from 'express';
import { catchAsync } from '../../middlewares/catchAsync';
import { AuthRequest } from '../../middlewares/auth';
import * as userService from './user.service'; 
import { AppError } from '../../utils/errorHandler';
import { clearAuthCookies, setAuthCookies } from '../../utils/cookie';
import { getUserId } from '../../utils/common';
import { sendSuccess, sendCreated, sendError } from '../../utils/response';

// --- AUTHENTICATION FLOWS ---

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.registerUser(req.body);
  
  if (!result.success) {
    return sendError(res, result.message || 'Registration failed', 400, result.errors);
  }
  
  return sendCreated(res, undefined, result.data?.message ?? result.message);
});

export const activate = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.activateUser(req.body.email, req.body.activationCode);
  
  if (!result.success) {
    return sendError(res, result.message || 'Activation failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, result.message);
});

export const resendActivation = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.resendActivationCode(req.body.email);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to resend activation code', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, result.message);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.loginUser(req.body.email, req.body.password);
  
  if (!result.success) {
    return sendError(res, result.message || 'Login failed', 401, result.errors);
  }
  
  const { user, accessToken, refreshToken } = result.data!;
  setAuthCookies(res, accessToken, refreshToken);
  
 return sendSuccess(res, { user, accessToken, refreshToken }, 'Login successful');
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  console.log("🔄 Refresh attempt:")
  console.log("  Cookie token:", req.cookies?.refreshToken ? "YES" : "NO")
  console.log("  Body token:", req.body?.refreshToken ? "YES" : "NO")
  console.log("  Final token:", token ? "YES" : "NO")
  
  if (!token) {
    throw new AppError('Refresh token is required. Please login again', 401);
  }

  const result = await userService.refreshAccessToken(token);
  
  if (!result.success) {
    return sendError(res, result.message || 'Token refresh failed', 401, result.errors);
  }
  
  const { accessToken, refreshToken: newRefreshToken } = result.data!;
  setAuthCookies(res, accessToken, newRefreshToken);
  
  return sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, 'Access token refreshed');
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const result = await userService.logoutUser(userId);
  
  if (!result.success) {
    return sendError(res, result.message || 'Logout failed', 500, result.errors);
  }
  
  clearAuthCookies(res);
  return sendSuccess(res, undefined, 'Logged out successfully');
});

export const social = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.socialAuth(req.body.email, req.body.name, req.body.avatar);
  
  if (!result.success) {
    return sendError(res, result.message || 'Social authentication failed', 401, result.errors);
  }
  
  const { user, accessToken, refreshToken } = result.data!;
  setAuthCookies(res, accessToken, refreshToken);
  
  // Return user with tokens for frontend (consistent with login endpoint)
  return sendSuccess(res, { user, accessToken, refreshToken }, 'Social authentication successful');
});

// --- PROFILE MANAGEMENT ---

export const getUser = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const result = await userService.getUserById(userId);
  
  if (!result.success) {
    return sendError(res, result.message || 'User not found', 404, result.errors);
  }
  
  return sendSuccess(res, result.data, 'User retrieved successfully');
});

export const updateProfile = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const result = await userService.updateUserProfile(userId, req.body);
  
  if (!result.success) {
    return sendError(res, result.message || 'Profile update failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Profile updated successfully');
});

export const updateProfilePicture = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const result = await userService.updateProfilePictureService(userId, req.body.avatar);
  
  if (!result.success) {
    return sendError(res, result.message || 'Profile picture update failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Profile picture updated successfully');
});

// --- PASSWORD MANAGEMENT ---

export const resetPasswordController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const { password, newPassword } = req.body;
  const result = await userService.resetPassword(userId, password, newPassword);
  
  if (!result.success) {
    return sendError(res, result.message || 'Password reset failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, 'Password reset successfully');
});

export const forgotPasswordController = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await userService.forgotPassword(email);
  
  if (!result.success) {
    return sendError(res, result.message || 'Password reset request failed', 400, result.errors);
  }
  
  return sendSuccess(res, undefined, result.message);
});

export const resetPasswordWithOtpController = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.resetPasswordWithOtp(req.body.email, req.body.otp, req.body.newPassword);
  
  if (!result.success) {
    return sendError(res, result.message || 'Password reset failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, result.message);
});

// --- ADMIN ONLY FUNCTIONS ---

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  
  if (!id || !role) {
    return sendError(res, 'User ID and role are required', 400, ['Missing required parameters']);
  }
  
  const result = await userService.updateUserRoleService(id, role);
  
  if (!result.success) {
    return sendError(res, result.message || 'Role update failed', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, result.message);
});

// --- ADMIN ONLY CONTROLLERS ---

export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;

  const result = await userService.getAllUsersService(page, limit, search, role);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve users', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, result.message);
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    return sendError(res, 'User ID is required', 400, ['Missing required parameter']);
  }
  
  const result = await userService.deleteUserService(id);
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to delete user', 400, result.errors);
  }
  
  return sendSuccess(res, result.data, result.message);
});

export const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getUserStatsService();
  
  if (!result.success) {
    return sendError(res, result.message || 'Failed to retrieve user stats', 500, result.errors);
  }
  
  return sendSuccess(res, result.data, result.message);
});