// src/modules/users/user.repository.ts

import { ClientSession } from 'mongoose';
import User, { IUser } from './user.model';

// --- READ Operations ---

export const findUserByEmail = (email: string): Promise<IUser | null> => {
  return User.findOne({ email });
};

export const findUserForLogin = (email: string): Promise<IUser | null> => {
  return User.findOne({ email }).select('+password');
};

export const findUserForActivation = (email: string): Promise<IUser | null> => {
  return User.findOne({ email }).select('+activationCode +activationCodeExpiry');
};

export const findUserById = (userId: string): Promise<IUser | null> => {
  return User.findById(userId).select('-password');
};

export const findUserForTokenRefresh = (userId: string): Promise<IUser | null> => {
    return User.findById(userId).select('+refreshToken');
};

export const findUserForPasswordReset = (email: string): Promise<IUser | null> => {
    return User.findOne({ email }).select('+password +resetPasswordOtp +resetPasswordOtpExpiry');
};

export const findUserForPasswordResetById = (userId: string): Promise<IUser | null> => {
  return User.findById(userId).select('+password');
};

export const findUserForOtpReset = (email: string): Promise<IUser | null> => {
    return User.findOne({ email }).select('+password +resetPasswordOtp +resetPasswordOtpExpiry');
};

// --- WRITE Operations ---

export const saveUser = (user: IUser, session?: ClientSession): Promise<IUser> => {
  return user.save({ session });
};

export const updateProfileData = (userId: string, updateData: any): Promise<IUser | null> => {
  return User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-password');
};

export const updateRefreshToken = (user: IUser, refreshToken: string, expiry: Date): Promise<IUser> => {
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = expiry;
    return user.save();
};

export const updateUserRole = (userId: string, role: string): Promise<IUser | null> => {
  return User.findByIdAndUpdate(
    userId, 
    { role }, 
    { 
      new: true, 
      runValidators: true 
    }
  ).select('-password');
};

// --- ADMIN Operations ---

export const getAllUsers = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string
): Promise<{ users: IUser[]; total: number }> => {
  const query: any = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (role) {
    query.role = role;
  }

  const skip = (page - 1) * limit;

  return Promise.all([
    User.find(query)
      .select('-password -refreshToken -resetPasswordOtp -activationCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]).then(([users, total]) => ({ users: users as unknown as IUser[], total }));
};

export const deleteUserById = (userId: string): Promise<IUser | null> => {
  return User.findByIdAndDelete(userId);
};

export const getUserStats = async (): Promise<{
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalAdmins: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}> => {
  const [
    totalUsers,
    totalStudents,
    totalInstructors,
    totalAdmins,
    verifiedUsers,
    unverifiedUsers
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'instructor' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isVerified: false })
  ]);

  return {
    totalUsers,
    totalStudents,
    totalInstructors,
    totalAdmins,
    verifiedUsers,
    unverifiedUsers
  };
};