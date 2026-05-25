import bcrypt from "bcrypt";
import { sendEmail } from "../../utils/email";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/token";
import { getCacheWithTTL, invalidateCache, setCache } from "../../utils/cache";
import {
    findUserByEmail, findUserForLogin, findUserForActivation, findUserById,
    findUserForTokenRefresh, saveUser, updateProfileData, updateRefreshToken,
    findUserForPasswordReset, findUserForPasswordResetById, findUserForOtpReset,
    updateUserRole, getAllUsers, deleteUserById, getUserStats
} from "./user.repository"; 
import User, { IUser } from "./user.model";
import crypto from "crypto";
import cloudinary from "cloudinary";
import { DEFAULT_TTL } from "../../config/cacheConfig";
import { ServiceResponse } from "../../@types/api";

export const registerUser = async (userData: {
  name: string;
  email: string;
  password?: string;
  role?: string;
}): Promise<ServiceResponse<{ message: string }>> => {
  try {
    const { name, email, password } = userData;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return {
        success: false,
        message: "Email already in use",
        errors: ["An account with this email already exists"]
      };
    }

    const hashedPassword = await bcrypt.hash(password as string, 10);

    const existingUserCount = await User.estimatedDocumentCount();
    const assignedRole: IUser["role"] = existingUserCount === 0 ? "admin" : "user";

    const newUser = new User({ name, email, password: hashedPassword, role: assignedRole });

    const activationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    newUser.activationCode = activationCode;
    newUser.activationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    newUser.lastActivationCodeSentAt = new Date();

    await saveUser(newUser);

    await sendEmail(email, "Activate Your Account - Skilledustore", "activation", { 
      activationCode, 
      name: name,
      email: email 
    });

    return { 
      success: true,
      data: { message: "Check your email to activate your account." },
      message: "Registration successful"
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Registration failed",
      errors: [error.message]
    };
  }
};

export const activateUser = async (email: string, activationCode: string): Promise<ServiceResponse<{ user: IUser; message: string }>> => {
  try {
    const user = await findUserForActivation(email);
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
    await saveUser(user);

    return { 
      success: true,
      data: { user, message: "Account activated successfully." },
      message: "Account activated successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Account activation failed",
      errors: [error.message]
    };
  }
};

export const resendActivationCode = async (email: string): Promise<ServiceResponse<{ message: string; retryAfter?: number }>> => {
  try {
    const user = await findUserByEmail(email);
    
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

    const activationCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    user.activationCode = activationCode;
    user.activationCodeExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.lastActivationCodeSentAt = new Date();

    await saveUser(user);

    await sendEmail(email, "Activate Your Account - Skilledustore", "activation", { 
      activationCode, 
      name: user.name,
      email: email 
    });

    return {
      success: true,
      data: { message: "A new activation code has been sent to your email." },
      message: "Activation code sent successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to resend activation code",
      errors: [error.message]
    };
  }
};

export const loginUser = async (email: string, password: string): Promise<ServiceResponse<{ user: IUser; accessToken: string; refreshToken: string }>> => {
  try {
    const user = await findUserForLogin(email);

    if (!user || !(await bcrypt.compare(password, user.password as string))) {
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

    const accessToken = generateAccessToken({ id: user._id!.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id!.toString(), role: user.role });

    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await updateRefreshToken(user, refreshToken, expiry);

    const userWithoutPassword = user.toObject();
    userWithoutPassword.password = undefined;

    await setCache(`user:${user._id!.toString()}`, userWithoutPassword, DEFAULT_TTL);

    return {
      success: true,
      data: { user: userWithoutPassword, accessToken, refreshToken },
      message: "Login successful"
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Login failed",
      errors: [error.message]
    };
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<ServiceResponse<{ accessToken: string; refreshToken: string }>> => {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await findUserForTokenRefresh(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return {
        success: false,
        message: "Invalid refresh token",
        errors: ["The refresh token is invalid or expired"]
      };
    }

    const accessToken = generateAccessToken({ id: user._id!.toString(), role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user._id!.toString(), role: user.role });

    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await updateRefreshToken(user, newRefreshToken, expiry);

    const userWithoutPassword = user.toObject();
    userWithoutPassword.password = undefined;
    await setCache(`user:${user._id!.toString()}`, userWithoutPassword, DEFAULT_TTL);

    return {
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
      message: "Token refreshed successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Token refresh failed",
      errors: [error.message]
    };
  }
};

export const logoutUser = async (userId: string): Promise<ServiceResponse<null>> => {
  try {
    const user = await findUserById(userId);
    if (user) {
      user.refreshToken = null;
      user.refreshTokenExpiry = null;
      await saveUser(user);
      await invalidateCache(`user:${userId}`);
    }
    
    return {
      success: true,
      data: null,
      message: "Logout successful"
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Logout failed",
      errors: [error.message]
    };
  }
};

export const getUserById = async (userId: string): Promise<ServiceResponse<IUser | null>> => {
  try {
    const cacheKey = `user:${userId}`;
    const cachedData = await getCacheWithTTL<IUser>(cacheKey);

    if (cachedData && cachedData.data) {
      return {
        success: true,
        data: cachedData.data,
        message: "User retrieved from cache"
      };
    }

    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
        errors: ["No user found with the provided ID"]
      };
    }

    await setCache(cacheKey, user, 20 * 60);

    return {
      success: true,
      data: user,
      message: "User retrieved successfully"
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to retrieve user",
      errors: [error.message]
    };
  }
};

export const socialAuth = async (email: string, name: string, avatar?: { public_id: string; url: string }): Promise<ServiceResponse<{ user: IUser; accessToken: string; refreshToken: string }>> => {
  try {
    if (!email || !name) {
      return {
        success: false,
        message: "Email and name are required for social authentication",
        errors: ["Missing required fields"]
      };
    }

    let user = await findUserByEmail(email);

    if (!user) {
      console.log(`Creating new user for social auth: ${email}`);
      const newUser = new User({ 
        email, 
        name, 
        role: "user", 
        isVerified: true
      });
      if (avatar) newUser.avatar = avatar;
      user = await saveUser(newUser);
      console.log(`✅ New user created: ${user._id}`);
    } else {
      console.log(`✅ Existing user found: ${user._id}`);
      if (avatar && avatar.url !== user.avatar?.url) {
        user.avatar = avatar;
        await user.save();
      }
    }

    const accessToken = generateAccessToken({ id: user._id!.toString(), role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id!.toString(), role: user.role });

    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await updateRefreshToken(user, refreshToken, expiry);

    const userWithoutPassword = user.toObject();
    userWithoutPassword.password = undefined;
    
    await setCache(`user:${user._id!.toString()}`, userWithoutPassword, DEFAULT_TTL);

    console.log(`✅ Social auth successful for: ${email}`);

    return {
      success: true,
      data: { user: userWithoutPassword, accessToken, refreshToken },
      message: "Social authentication successful"
    };
  } catch (error: any) {
    console.error("❌ Social authentication error:", error);
    return {
      success: false,
      message: "Social authentication failed",
      errors: [error.message || "Unknown error"]
    };
  }
};

export const updateUserProfile = async (userId: string, updateData: any): Promise<ServiceResponse<IUser>> => {
  try {
    const allowedUpdates = ['name', 'email', 'bio']; 
    const filteredData: any = {};

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

    const user = await updateProfileData(userId, filteredData);

    if (!user) {
        return {
            success: false,
            message: "User not found",
            errors: ["No user found with the provided ID"]
        };
    }

    await invalidateCache(`user:${userId}`);

    return {
        success: true,
        data: user,
        message: "Profile updated successfully"
    };
  } catch (error: any) {
    return {
        success: false,
        message: "Profile update failed",
        errors: [error.message]
    };
  }
};

export const resetPassword = async (userId: string, currentPassword?: string, newPassword?: string): Promise<ServiceResponse<IUser>> => {
  try {
    const user = await findUserForPasswordResetById(userId); 
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
    
    if (!(await bcrypt.compare(currentPassword as string, user.password as string))) {
      return {
        success: false,
        message: 'Invalid current password',
        errors: ['The current password is incorrect']
      };
    }
    
    const hashedPassword = await bcrypt.hash(newPassword as string, 10);
    
    user.password = hashedPassword;
    await saveUser(user);
    
    await invalidateCache(`user:${userId}`);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;
    
    return {
      success: true,
      data: userWithoutPassword,
      message: 'Password reset successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Password reset failed',
      errors: [error.message]
    };
  }
};

export const forgotPassword = async (email: string): Promise<ServiceResponse<{ message: string }>> => {
  try {
    const user = await findUserForOtpReset(email); 
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

    const otp = crypto.randomBytes(3).toString('hex').toUpperCase();
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.resetPasswordOtp = hashedOtp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    await saveUser(user);
    await sendEmail(email, 'Password Reset Request', 'forgot-password', {name:user?.name, otp, email});

    return {
      success: true,
      data: { message: 'Password reset OTP sent to your email.' },
      message: 'OTP sent successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to send password reset OTP',
      errors: [error.message]
    };
  }
};

export const resetPasswordWithOtp = async (email: string, otp: string, newPassword: string): Promise<ServiceResponse<{ user: IUser; message: string }>> => {
  try {
    const user = await findUserForOtpReset(email);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errors: ['No user found with this email address']
      };
    }

    if (!user.resetPasswordOtp || !(await bcrypt.compare(otp, user.resetPasswordOtp))) {
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { password: hashedPassword, resetPasswordOtp: null, resetPasswordOtpExpiry: null },
      { new: true, runValidators: true }
    );

    return {
      success: true,
      data: { user: updatedUser!, message: 'Password reset successfully.' },
      message: 'Password reset successful'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Password reset failed',
      errors: [error.message]
    };
  }
};

export const updateProfilePictureService = async (userId: string, avatarData: string): Promise<ServiceResponse<IUser>> => {
  try {
    const user = await findUserById(userId);
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
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      } catch (deleteError) {
        console.warn(`Failed to delete old avatar from Cloudinary: ${deleteError}`);
      }
    }

    const result = await cloudinary.v2.uploader.upload(avatarData, {
        folder: 'avatars',
        width: 150,
        crop: 'fill',
        gravity: 'face',
    });
    
    user.avatar = { public_id: result.public_id, url: result.secure_url };
    await saveUser(user);
    
    await setCache(`user:${userId}`, user, DEFAULT_TTL);

    return {
      success: true,
      data: user,
      message: 'Profile picture updated successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Profile picture update failed',
      errors: [error.message]
    };
  }
};

export const updateUserRoleService = async (userId: string, newRole: string): Promise<ServiceResponse<IUser>> => {
  try {
    const validRoles = ['user', 'instructor', 'admin'];
    if (!validRoles.includes(newRole)) {
      return {
        success: false,
        message: 'Invalid role',
        errors: ['Role must be one of: user, instructor, admin']
      };
    }

    const existingUser = await findUserById(userId);
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

    const updatedUser = await updateUserRole(userId, newRole);
    
    if (!updatedUser) {
      return {
        success: false,
        message: 'Failed to update user role',
        errors: ['Unable to update user role']
      };
    }

    await invalidateCache(`user:${userId}`);

    return {
      success: true,
      data: updatedUser,
      message: `User role updated to ${newRole} successfully`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to update user role',
      errors: [error.message]
    };
  }
};

export const getAllUsersService = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string
): Promise<ServiceResponse<{ users: IUser[]; total: number; page: number; pages: number }>> => {
  try {
    const { users, total } = await getAllUsers(page, limit, search, role);
    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: { users, total, page, pages },
      message: 'Users retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve users',
      errors: [error.message]
    };
  }
};

export const deleteUserService = async (userId: string): Promise<ServiceResponse<null>> => {
  try {
    const user = await findUserById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        errors: ['No user found with the provided ID']
      };
    }

    await deleteUserById(userId);
    await invalidateCache(`user:${userId}`);

    return {
      success: true,
      data: null,
      message: 'User deleted successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to delete user',
      errors: [error.message]
    };
  }
};

export const getUserStatsService = async (): Promise<ServiceResponse<{
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}>> => {
  try {
    const stats = await getUserStats();

    return {
      success: true,
      data: stats,
      message: 'User stats retrieved successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Failed to retrieve user stats',
      errors: [error.message]
    };
  }
};