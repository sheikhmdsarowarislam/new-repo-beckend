"use strict";
// src/modules/users/user.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.deleteUserById = exports.getAllUsers = exports.updateUserRole = exports.updateRefreshToken = exports.updateProfileData = exports.saveUser = exports.findUserForOtpReset = exports.findUserForPasswordResetById = exports.findUserForPasswordReset = exports.findUserForTokenRefresh = exports.findUserById = exports.findUserForActivation = exports.findUserForLogin = exports.findUserByEmail = void 0;
const user_model_1 = __importDefault(require("./user.model"));
// --- READ Operations ---
const findUserByEmail = (email) => {
    return user_model_1.default.findOne({ email });
};
exports.findUserByEmail = findUserByEmail;
const findUserForLogin = (email) => {
    return user_model_1.default.findOne({ email }).select('+password');
};
exports.findUserForLogin = findUserForLogin;
const findUserForActivation = (email) => {
    return user_model_1.default.findOne({ email }).select('+activationCode +activationCodeExpiry');
};
exports.findUserForActivation = findUserForActivation;
const findUserById = (userId) => {
    return user_model_1.default.findById(userId).select('-password');
};
exports.findUserById = findUserById;
const findUserForTokenRefresh = (userId) => {
    return user_model_1.default.findById(userId).select('+refreshToken');
};
exports.findUserForTokenRefresh = findUserForTokenRefresh;
const findUserForPasswordReset = (email) => {
    return user_model_1.default.findOne({ email }).select('+password +resetPasswordOtp +resetPasswordOtpExpiry');
};
exports.findUserForPasswordReset = findUserForPasswordReset;
const findUserForPasswordResetById = (userId) => {
    return user_model_1.default.findById(userId).select('+password');
};
exports.findUserForPasswordResetById = findUserForPasswordResetById;
const findUserForOtpReset = (email) => {
    return user_model_1.default.findOne({ email }).select('+password +resetPasswordOtp +resetPasswordOtpExpiry');
};
exports.findUserForOtpReset = findUserForOtpReset;
// --- WRITE Operations ---
const saveUser = (user, session) => {
    return user.save({ session });
};
exports.saveUser = saveUser;
const updateProfileData = (userId, updateData) => {
    return user_model_1.default.findByIdAndUpdate(userId, updateData, {
        new: true,
        runValidators: true,
    }).select('-password');
};
exports.updateProfileData = updateProfileData;
const updateRefreshToken = (user, refreshToken, expiry) => {
    user.refreshToken = refreshToken;
    user.refreshTokenExpiry = expiry;
    return user.save();
};
exports.updateRefreshToken = updateRefreshToken;
const updateUserRole = (userId, role) => {
    return user_model_1.default.findByIdAndUpdate(userId, { role }, {
        new: true,
        runValidators: true
    }).select('-password');
};
exports.updateUserRole = updateUserRole;
// --- ADMIN Operations ---
const getAllUsers = (page = 1, limit = 10, search, role) => {
    const query = {};
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
        user_model_1.default.find(query)
            .select('-password -refreshToken -resetPasswordOtp -activationCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        user_model_1.default.countDocuments(query)
    ]).then(([users, total]) => ({ users: users, total }));
};
exports.getAllUsers = getAllUsers;
const deleteUserById = (userId) => {
    return user_model_1.default.findByIdAndDelete(userId);
};
exports.deleteUserById = deleteUserById;
const getUserStats = async () => {
    const [totalUsers, totalStudents, totalInstructors, totalAdmins, verifiedUsers, unverifiedUsers] = await Promise.all([
        user_model_1.default.countDocuments(),
        user_model_1.default.countDocuments({ role: 'user' }),
        user_model_1.default.countDocuments({ role: 'instructor' }),
        user_model_1.default.countDocuments({ role: 'admin' }),
        user_model_1.default.countDocuments({ isVerified: true }),
        user_model_1.default.countDocuments({ isVerified: false })
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
exports.getUserStats = getUserStats;
//# sourceMappingURL=user.repository.js.map