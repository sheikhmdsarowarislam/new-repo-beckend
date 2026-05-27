"use strict";
// src/modules/users/user.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.deleteUser = exports.getAllUsers = exports.updateUserRole = exports.resetPasswordWithOtpController = exports.forgotPasswordController = exports.resetPasswordController = exports.updateProfilePicture = exports.updateProfile = exports.getUser = exports.social = exports.logout = exports.refresh = exports.login = exports.resendActivation = exports.activate = exports.register = void 0;
const catchAsync_1 = require("../../middlewares/catchAsync");
const userService = __importStar(require("./user.service"));
const errorHandler_1 = require("../../utils/errorHandler");
const cookie_1 = require("../../utils/cookie");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// --- AUTHENTICATION FLOWS ---
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await userService.registerUser(req.body);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Registration failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, undefined, result.data?.message ?? result.message);
});
exports.activate = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await userService.activateUser(req.body.email, req.body.activationCode);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Activation failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
exports.resendActivation = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await userService.resendActivationCode(req.body.email);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to resend activation code', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await userService.loginUser(req.body.email, req.body.password);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Login failed', 401, result.errors);
    }
    const { user, accessToken, refreshToken } = result.data;
    (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
    return (0, response_1.sendSuccess)(res, { user, accessToken, refreshToken }, 'Login successful');
});
exports.refresh = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    console.log("🔄 Refresh attempt:");
    console.log("  Cookie token:", req.cookies?.refreshToken ? "YES" : "NO");
    console.log("  Body token:", req.body?.refreshToken ? "YES" : "NO");
    console.log("  Final token:", token ? "YES" : "NO");
    if (!token) {
        throw new errorHandler_1.AppError('Refresh token is required. Please login again', 401);
    }
    const result = await userService.refreshAccessToken(token);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Token refresh failed', 401, result.errors);
    }
    const { accessToken, refreshToken: newRefreshToken } = result.data;
    (0, cookie_1.setAuthCookies)(res, accessToken, newRefreshToken);
    return (0, response_1.sendSuccess)(res, { accessToken, refreshToken: newRefreshToken }, 'Access token refreshed');
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await userService.logoutUser(userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Logout failed', 500, result.errors);
    }
    (0, cookie_1.clearAuthCookies)(res);
    return (0, response_1.sendSuccess)(res, undefined, 'Logged out successfully');
});
exports.social = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await userService.socialAuth(req.body.email, req.body.name, req.body.avatar);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Social authentication failed', 401, result.errors);
    }
    const { user, accessToken, refreshToken } = result.data;
    (0, cookie_1.setAuthCookies)(res, accessToken, refreshToken);
    // Return user with tokens for frontend (consistent with login endpoint)
    return (0, response_1.sendSuccess)(res, { user, accessToken, refreshToken }, 'Social authentication successful');
});
// --- PROFILE MANAGEMENT ---
exports.getUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await userService.getUserById(userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'User not found', 404, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'User retrieved successfully');
});
exports.updateProfile = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await userService.updateUserProfile(userId, req.body);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Profile update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Profile updated successfully');
});
exports.updateProfilePicture = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await userService.updateProfilePictureService(userId, req.body.avatar);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Profile picture update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Profile picture updated successfully');
});
// --- PASSWORD MANAGEMENT ---
exports.resetPasswordController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { password, newPassword } = req.body;
    const result = await userService.resetPassword(userId, password, newPassword);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Password reset failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Password reset successfully');
});
exports.forgotPasswordController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email } = req.body;
    const result = await userService.forgotPassword(email);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Password reset request failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, undefined, result.message);
});
exports.resetPasswordWithOtpController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await userService.resetPasswordWithOtp(req.body.email, req.body.otp, req.body.newPassword);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Password reset failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
// --- ADMIN ONLY FUNCTIONS ---
exports.updateUserRole = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!id || !role) {
        return (0, response_1.sendError)(res, 'User ID and role are required', 400, ['Missing required parameters']);
    }
    const result = await userService.updateUserRoleService(id, role);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Role update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
// --- ADMIN ONLY CONTROLLERS ---
exports.getAllUsers = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const role = req.query.role;
    const result = await userService.getAllUsersService(page, limit, search, role);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve users', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
exports.deleteUser = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return (0, response_1.sendError)(res, 'User ID is required', 400, ['Missing required parameter']);
    }
    const result = await userService.deleteUserService(id);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to delete user', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
exports.getUserStats = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const result = await userService.getUserStatsService();
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve user stats', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message);
});
//# sourceMappingURL=user.controller.js.map