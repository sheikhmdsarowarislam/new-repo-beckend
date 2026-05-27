import { ClientSession } from 'mongoose';
import { IUser } from './user.model';
export declare const findUserByEmail: (email: string) => Promise<IUser | null>;
export declare const findUserForLogin: (email: string) => Promise<IUser | null>;
export declare const findUserForActivation: (email: string) => Promise<IUser | null>;
export declare const findUserById: (userId: string) => Promise<IUser | null>;
export declare const findUserForTokenRefresh: (userId: string) => Promise<IUser | null>;
export declare const findUserForPasswordReset: (email: string) => Promise<IUser | null>;
export declare const findUserForPasswordResetById: (userId: string) => Promise<IUser | null>;
export declare const findUserForOtpReset: (email: string) => Promise<IUser | null>;
export declare const saveUser: (user: IUser, session?: ClientSession) => Promise<IUser>;
export declare const updateProfileData: (userId: string, updateData: any) => Promise<IUser | null>;
export declare const updateRefreshToken: (user: IUser, refreshToken: string, expiry: Date) => Promise<IUser>;
export declare const updateUserRole: (userId: string, role: string) => Promise<IUser | null>;
export declare const getAllUsers: (page?: number, limit?: number, search?: string, role?: string) => Promise<{
    users: IUser[];
    total: number;
}>;
export declare const deleteUserById: (userId: string) => Promise<IUser | null>;
export declare const getUserStats: () => Promise<{
    totalUsers: number;
    totalStudents: number;
    totalInstructors: number;
    totalAdmins: number;
    verifiedUsers: number;
    unverifiedUsers: number;
}>;
//# sourceMappingURL=user.repository.d.ts.map