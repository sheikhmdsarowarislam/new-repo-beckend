import { IUser } from "./user.model";
import { ServiceResponse } from "../../@types/api";
export declare const registerUser: (userData: {
    name: string;
    email: string;
    password?: string;
    role?: string;
}) => Promise<ServiceResponse<{
    message: string;
}>>;
export declare const activateUser: (email: string, activationCode: string) => Promise<ServiceResponse<{
    user: IUser;
    message: string;
}>>;
export declare const resendActivationCode: (email: string) => Promise<ServiceResponse<{
    message: string;
    retryAfter?: number;
}>>;
export declare const loginUser: (email: string, password: string) => Promise<ServiceResponse<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
}>>;
export declare const refreshAccessToken: (refreshToken: string) => Promise<ServiceResponse<{
    accessToken: string;
    refreshToken: string;
}>>;
export declare const logoutUser: (userId: string) => Promise<ServiceResponse<null>>;
export declare const getUserById: (userId: string) => Promise<ServiceResponse<IUser | null>>;
export declare const socialAuth: (email: string, name: string, avatar?: {
    public_id: string;
    url: string;
}) => Promise<ServiceResponse<{
    user: IUser;
    accessToken: string;
    refreshToken: string;
}>>;
export declare const updateUserProfile: (userId: string, updateData: any) => Promise<ServiceResponse<IUser>>;
export declare const resetPassword: (userId: string, currentPassword?: string, newPassword?: string) => Promise<ServiceResponse<IUser>>;
export declare const forgotPassword: (email: string) => Promise<ServiceResponse<{
    message: string;
}>>;
export declare const resetPasswordWithOtp: (email: string, otp: string, newPassword: string) => Promise<ServiceResponse<{
    user: IUser;
    message: string;
}>>;
export declare const updateProfilePictureService: (userId: string, avatarData: string) => Promise<ServiceResponse<IUser>>;
export declare const updateUserRoleService: (userId: string, newRole: string) => Promise<ServiceResponse<IUser>>;
export declare const getAllUsersService: (page?: number, limit?: number, search?: string, role?: string) => Promise<ServiceResponse<{
    users: IUser[];
    total: number;
    page: number;
    pages: number;
}>>;
export declare const deleteUserService: (userId: string) => Promise<ServiceResponse<null>>;
export declare const getUserStatsService: () => Promise<ServiceResponse<{
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    verifiedUsers: number;
    unverifiedUsers: number;
}>>;
//# sourceMappingURL=user.service.d.ts.map