"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStatsService = exports.deleteUserService = exports.getAllUsersService = exports.updateUserRoleService = exports.updateProfilePictureService = exports.resetPasswordWithOtp = exports.forgotPassword = exports.resetPassword = exports.updateUserProfile = exports.socialAuth = exports.getUserById = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.resendActivationCode = exports.activateUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const email_1 = require("../../utils/email");
const token_1 = require("../../utils/token");
const cache_1 = require("../../utils/cache");
const user_repository_1 = require("./user.repository");
const user_model_1 = __importDefault(require("./user.model"));
const crypto_1 = __importDefault(require("crypto"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const cacheConfig_1 = require("../../config/cacheConfig");
const registerUser = async (userData) => {
    try {
        const { name, email, password } = userData;
        const existingUser = await (0, user_repository_1.findUserByEmail)(email);
        if (existingUser) {
            return {
                success: false,
                message: "Email already in use",
                errors: ["An account with this email already exists"]
            };
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const existingUserCount = await user_model_1.default.estimatedDocumentCount();
        const assignedRole = existingUserCount === 0 ? "admin" : "user";
        const newUser = new user_model_1.default({ name, email, password: hashedPassword, role: assignedRole });
        const activationCode = crypto_1.default.randomBytes(3).toString("hex").toUpperCase();
        newUser.activationCode = activationCode;
        newUser.activationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        newUser.lastActivationCodeSentAt = new Date();
        await (0, user_repository_1.saveUser)(newUser);
        await (0, email_1.sendEmail)(email, "Activate Your Account - Skilledustore", "activation", {
            activationCode,
            name: name,
            email: email
        });
        return {
            success: true,
            data: { message: "Check your email to activate your account." },
            message: "Registration successful"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Registration failed",
            errors: [error.message]
        };
    }
};
exports.registerUser = registerUser;
const activateUser = async (email, activationCode) => {
    try {
        const user = await (0, user_repository_1.findUserForActivation)(email);
        if (!user) {
            return {
                success: false,
                message: "User not found",
                errors: ["No user found with this email"]
            };
        }
        if (user.activationCode !== activationCode) {
            return {
                success: false,
                message: "Invalid activation code",
                errors: ["The activation code provided is incorrect"]
            };
        }
        if (user.activationCodeExpiry && user.activationCodeExpiry < new Date()) {
            return {
                success: false,
                message: "Activation code has expired",
                errors: ["The activation code has expired. Please request a new one"]
            };
        }
        user.isVerified = true;
        user.activationCode = undefined;
        user.activationCodeExpiry = undefined;
        await (0, user_repository_1.saveUser)(user);
        return {
            success: true,
            data: { user, message: "Account activated successfully." },
            message: "Account activated successfully"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Account activation failed",
            errors: [error.message]
        };
    }
};
exports.activateUser = activateUser;
const resendActivationCode = async (email) => {
    try {
        const user = await (0, user_repository_1.findUserByEmail)(email);
        if (!user) {
            return {
                success: false,
                message: "User not found",
                errors: ["No user found with this email address"]
            };
        }
        if (user.isVerified) {
            return {
                success: false,
                message: "Account already verified",
                errors: ["This account is already activated. Please login"]
            };
        }
        const COOLDOWN_PERIOD = 60 * 1000;
        if (user.lastActivationCodeSentAt) {
            const timeSinceLastSent = Date.now() - user.lastActivationCodeSentAt.getTime();
            const remainingTime = COOLDOWN_PERIOD - timeSinceLastSent;
            if (timeSinceLastSent < COOLDOWN_PERIOD) {
                const secondsRemaining = Math.ceil(remainingTime / 1000);
                return {
                    success: false,
                    message: "Please wait before requesting a new code",
                    errors: [`Please wait ${secondsRemaining} seconds before requesting another activation code`],
                    data: {
                        message: `Please wait ${secondsRemaining} seconds`,
                        retryAfter: secondsRemaining
                    }
                };
            }
        }
        const activationCode = crypto_1.default.randomBytes(3).toString("hex").toUpperCase();
        user.activationCode = activationCode;
        user.activationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.lastActivationCodeSentAt = new Date();
        await (0, user_repository_1.saveUser)(user);
        await (0, email_1.sendEmail)(email, "Activate Your Account - Skilledustore", "activation", {
            activationCode,
            name: user.name,
            email: email
        });
        return {
            success: true,
            data: { message: "A new activation code has been sent to your email." },
            message: "Activation code sent successfully"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Failed to resend activation code",
            errors: [error.message]
        };
    }
};
exports.resendActivationCode = resendActivationCode;
const loginUser = async (email, password) => {
    try {
        const user = await (0, user_repository_1.findUserForLogin)(email);
        if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
            return {
                success: false,
                message: "Incorrect email or password",
                errors: ["Invalid credentials provided"]
            };
        }
        if (!user.isVerified) {
            return {
                success: false,
                message: "Email not verified",
                errors: ["Please verify your email before logging in"]
            };
        }
        const accessToken = (0, token_1.generateAccessToken)({ id: user._id.toString(), role: user.role });
        const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id.toString(), role: user.role });
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, user_repository_1.updateRefreshToken)(user, refreshToken, expiry);
        const userWithoutPassword = user.toObject();
        userWithoutPassword.password = undefined;
        await (0, cache_1.setCache)(`user:${user._id.toString()}`, userWithoutPassword, cacheConfig_1.DEFAULT_TTL);
        return {
            success: true,
            data: { user: userWithoutPassword, accessToken, refreshToken },
            message: "Login successful"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Login failed",
            errors: [error.message]
        };
    }
};
exports.loginUser = loginUser;
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = (0, token_1.verifyRefreshToken)(refreshToken);
        const user = await (0, user_repository_1.findUserForTokenRefresh)(decoded.id);
        if (!user || user.refreshToken !== refreshToken) {
            return {
                success: false,
                message: "Invalid refresh token",
                errors: ["The refresh token is invalid or expired"]
            };
        }
        const accessToken = (0, token_1.generateAccessToken)({ id: user._id.toString(), role: user.role });
        const newRefreshToken = (0, token_1.generateRefreshToken)({ id: user._id.toString(), role: user.role });
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, user_repository_1.updateRefreshToken)(user, newRefreshToken, expiry);
        const userWithoutPassword = user.toObject();
        userWithoutPassword.password = undefined;
        await (0, cache_1.setCache)(`user:${user._id.toString()}`, userWithoutPassword, cacheConfig_1.DEFAULT_TTL);
        return {
            success: true,
            data: { accessToken, refreshToken: newRefreshToken },
            message: "Token refreshed successfully"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Token refresh failed",
            errors: [error.message]
        };
    }
};
exports.refreshAccessToken = refreshAccessToken;
const logoutUser = async (userId) => {
    try {
        const user = await (0, user_repository_1.findUserById)(userId);
        if (user) {
            user.refreshToken = null;
            user.refreshTokenExpiry = null;
            await (0, user_repository_1.saveUser)(user);
            await (0, cache_1.invalidateCache)(`user:${userId}`);
        }
        return {
            success: true,
            data: null,
            message: "Logout successful"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Logout failed",
            errors: [error.message]
        };
    }
};
exports.logoutUser = logoutUser;
const getUserById = async (userId) => {
    try {
        const cacheKey = `user:${userId}`;
        const cachedData = await (0, cache_1.getCacheWithTTL)(cacheKey);
        if (cachedData && cachedData.data) {
            return {
                success: true,
                data: cachedData.data,
                message: "User retrieved from cache"
            };
        }
        const user = await (0, user_repository_1.findUserById)(userId);
        if (!user) {
            return {
                success: false,
                message: "User not found",
                errors: ["No user found with the provided ID"]
            };
        }
        await (0, cache_1.setCache)(cacheKey, user, 20 * 60);
        return {
            success: true,
            data: user,
            message: "User retrieved successfully"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Failed to retrieve user",
            errors: [error.message]
        };
    }
};
exports.getUserById = getUserById;
const socialAuth = async (email, name, avatar) => {
    try {
        if (!email || !name) {
            return {
                success: false,
                message: "Email and name are required for social authentication",
                errors: ["Missing required fields"]
            };
        }
        let user = await (0, user_repository_1.findUserByEmail)(email);
        if (!user) {
            console.log(`Creating new user for social auth: ${email}`);
            const newUser = new user_model_1.default({
                email,
                name,
                role: "user",
                isVerified: true
            });
            if (avatar)
                newUser.avatar = avatar;
            user = await (0, user_repository_1.saveUser)(newUser);
            console.log(`✅ New user created: ${user._id}`);
        }
        else {
            console.log(`✅ Existing user found: ${user._id}`);
            if (avatar && avatar.url !== user.avatar?.url) {
                user.avatar = avatar;
                await user.save();
            }
        }
        const accessToken = (0, token_1.generateAccessToken)({ id: user._id.toString(), role: user.role });
        const refreshToken = (0, token_1.generateRefreshToken)({ id: user._id.toString(), role: user.role });
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await (0, user_repository_1.updateRefreshToken)(user, refreshToken, expiry);
        const userWithoutPassword = user.toObject();
        userWithoutPassword.password = undefined;
        await (0, cache_1.setCache)(`user:${user._id.toString()}`, userWithoutPassword, cacheConfig_1.DEFAULT_TTL);
        console.log(`✅ Social auth successful for: ${email}`);
        return {
            success: true,
            data: { user: userWithoutPassword, accessToken, refreshToken },
            message: "Social authentication successful"
        };
    }
    catch (error) {
        console.error("❌ Social authentication error:", error);
        return {
            success: false,
            message: "Social authentication failed",
            errors: [error.message || "Unknown error"]
        };
    }
};
exports.socialAuth = socialAuth;
const updateUserProfile = async (userId, updateData) => {
    try {
        const allowedUpdates = ['name', 'email', 'bio'];
        const filteredData = {};
        Object.keys(updateData).forEach(key => {
            if (allowedUpdates.includes(key) && updateData[key] !== undefined && updateData[key] !== null) {
                filteredData[key] = updateData[key];
            }
        });
        if (Object.keys(filteredData).length === 0) {
            return {
                success: false,
                message: "No valid fields provided for profile update",
                errors: ["Please provide valid fields to update"]
            };
        }
        const user = await (0, user_repository_1.updateProfileData)(userId, filteredData);
        if (!user) {
            return {
                success: false,
                message: "User not found",
                errors: ["No user found with the provided ID"]
            };
        }
        await (0, cache_1.invalidateCache)(`user:${userId}`);
        return {
            success: true,
            data: user,
            message: "Profile updated successfully"
        };
    }
    catch (error) {
        return {
            success: false,
            message: "Profile update failed",
            errors: [error.message]
        };
    }
};
exports.updateUserProfile = updateUserProfile;
const resetPassword = async (userId, currentPassword, newPassword) => {
    try {
        const user = await (0, user_repository_1.findUserForPasswordResetById)(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
                errors: ['No user found with the provided ID']
            };
        }
        if (!user.password) {
            return {
                success: false,
                message: 'Cannot reset password for this account type',
                errors: ['This account does not support password reset']
            };
        }
        if (!(await bcrypt_1.default.compare(currentPassword, user.password))) {
            return {
                success: false,
                message: 'Invalid current password',
                errors: ['The current password is incorrect']
            };
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        user.password = hashedPassword;
        await (0, user_repository_1.saveUser)(user);
        await (0, cache_1.invalidateCache)(`user:${userId}`);
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;
        return {
            success: true,
            data: userWithoutPassword,
            message: 'Password reset successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Password reset failed',
            errors: [error.message]
        };
    }
};
exports.resetPassword = resetPassword;
const forgotPassword = async (email) => {
    try {
        const user = await (0, user_repository_1.findUserForOtpReset)(email);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
                errors: ['No user found with this email address']
            };
        }
        if (!user.password) {
            return {
                success: false,
                message: 'This account does not have a password',
                errors: ['Please use social authentication to log in']
            };
        }
        const otp = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
        const hashedOtp = await bcrypt_1.default.hash(otp, 10);
        user.resetPasswordOtp = hashedOtp;
        user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await (0, user_repository_1.saveUser)(user);
        await (0, email_1.sendEmail)(email, 'Password Reset Request', 'forgot-password', { name: user?.name, otp, email });
        return {
            success: true,
            data: { message: 'Password reset OTP sent to your email.' },
            message: 'OTP sent successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to send password reset OTP',
            errors: [error.message]
        };
    }
};
exports.forgotPassword = forgotPassword;
const resetPasswordWithOtp = async (email, otp, newPassword) => {
    try {
        const user = await (0, user_repository_1.findUserForOtpReset)(email);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
                errors: ['No user found with this email address']
            };
        }
        if (!user.resetPasswordOtp || !(await bcrypt_1.default.compare(otp, user.resetPasswordOtp))) {
            return {
                success: false,
                message: 'Invalid or incorrect OTP',
                errors: ['The OTP provided is incorrect']
            };
        }
        if (user.resetPasswordOtpExpiry && user.resetPasswordOtpExpiry < new Date()) {
            return {
                success: false,
                message: 'OTP has expired',
                errors: ['The OTP has expired. Please request a new one']
            };
        }
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        const updatedUser = await user_model_1.default.findByIdAndUpdate(user._id, { password: hashedPassword, resetPasswordOtp: null, resetPasswordOtpExpiry: null }, { new: true, runValidators: true });
        return {
            success: true,
            data: { user: updatedUser, message: 'Password reset successfully.' },
            message: 'Password reset successful'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Password reset failed',
            errors: [error.message]
        };
    }
};
exports.resetPasswordWithOtp = resetPasswordWithOtp;
const updateProfilePictureService = async (userId, avatarData) => {
    try {
        const user = await (0, user_repository_1.findUserById)(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
                errors: ['No user found with the provided ID']
            };
        }
        if (user?.avatar?.public_id) {
            const isSocialAuthAvatar = user.avatar.public_id.match(/^(google|facebook|github|twitter)_/);
            if (isSocialAuthAvatar) {
                return {
                    success: false,
                    message: 'Cannot update avatar for social authentication accounts',
                    errors: ['Users who signed in with Google, Facebook, or other social providers cannot change their profile picture. Your avatar is linked to your social account.']
                };
            }
            try {
                await cloudinary_1.default.v2.uploader.destroy(user.avatar.public_id);
            }
            catch (deleteError) {
                console.warn(`Failed to delete old avatar from Cloudinary: ${deleteError}`);
            }
        }
        const result = await cloudinary_1.default.v2.uploader.upload(avatarData, {
            folder: 'avatars',
            width: 150,
            crop: 'fill',
            gravity: 'face',
        });
        user.avatar = { public_id: result.public_id, url: result.secure_url };
        await (0, user_repository_1.saveUser)(user);
        await (0, cache_1.setCache)(`user:${userId}`, user, cacheConfig_1.DEFAULT_TTL);
        return {
            success: true,
            data: user,
            message: 'Profile picture updated successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Profile picture update failed',
            errors: [error.message]
        };
    }
};
exports.updateProfilePictureService = updateProfilePictureService;
const updateUserRoleService = async (userId, newRole) => {
    try {
        const validRoles = ['user', 'instructor', 'admin'];
        if (!validRoles.includes(newRole)) {
            return {
                success: false,
                message: 'Invalid role',
                errors: ['Role must be one of: user, instructor, admin']
            };
        }
        const existingUser = await (0, user_repository_1.findUserById)(userId);
        if (!existingUser) {
            return {
                success: false,
                message: 'User not found',
                errors: ['No user found with the provided ID']
            };
        }
        if (existingUser.role === newRole) {
            return {
                success: false,
                message: 'User already has this role',
                errors: ['The user is already assigned to this role']
            };
        }
        const updatedUser = await (0, user_repository_1.updateUserRole)(userId, newRole);
        if (!updatedUser) {
            return {
                success: false,
                message: 'Failed to update user role',
                errors: ['Unable to update user role']
            };
        }
        await (0, cache_1.invalidateCache)(`user:${userId}`);
        return {
            success: true,
            data: updatedUser,
            message: `User role updated to ${newRole} successfully`
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to update user role',
            errors: [error.message]
        };
    }
};
exports.updateUserRoleService = updateUserRoleService;
const getAllUsersService = async (page = 1, limit = 10, search, role) => {
    try {
        const { users, total } = await (0, user_repository_1.getAllUsers)(page, limit, search, role);
        const pages = Math.ceil(total / limit);
        return {
            success: true,
            data: { users, total, page, pages },
            message: 'Users retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve users',
            errors: [error.message]
        };
    }
};
exports.getAllUsersService = getAllUsersService;
const deleteUserService = async (userId) => {
    try {
        const user = await (0, user_repository_1.findUserById)(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found',
                errors: ['No user found with the provided ID']
            };
        }
        await (0, user_repository_1.deleteUserById)(userId);
        await (0, cache_1.invalidateCache)(`user:${userId}`);
        return {
            success: true,
            data: null,
            message: 'User deleted successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to delete user',
            errors: [error.message]
        };
    }
};
exports.deleteUserService = deleteUserService;
const getUserStatsService = async () => {
    try {
        const stats = await (0, user_repository_1.getUserStats)();
        return {
            success: true,
            data: stats,
            message: 'User stats retrieved successfully'
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Failed to retrieve user stats',
            errors: [error.message]
        };
    }
};
exports.getUserStatsService = getUserStatsService;
//# sourceMappingURL=user.service.js.map