import mongoose, { Document, Types } from "mongoose";
export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    isVerified: boolean;
    role: "user" | "instructor" | "admin";
    avatar?: {
        public_id: string;
        url: string;
    };
    signature?: {
        public_id: string;
        url: string;
    };
    username: string;
    refreshToken?: string | null;
    refreshTokenExpiry?: Date | null;
    activationCode?: string | null;
    activationCodeExpiry?: Date | null;
    lastActivationCodeSentAt?: Date | null;
    resetPasswordOtp?: string | null;
    resetPasswordOtpExpiry?: Date | null;
}
declare const User: mongoose.Model<IUser, {}, {}, {}, mongoose.Document<unknown, {}, IUser, {}, {}> & IUser & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default User;
//# sourceMappingURL=user.model.d.ts.map