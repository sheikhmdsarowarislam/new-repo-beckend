import mongoose, { Schema, Document, Types } from "mongoose";

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

const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      validate: {
        validator: function (v: string) {
          return emailRegex.test(v);
        },
        message: (props: any) => `${props.value} is not a valid email!`,
      },
    },
    password: { type: String, required: false, select: false },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "instructor", "admin"],
      default: "user",
    },
    avatar: {
      public_id: { type: String, default: null },
      url: { type: String, default: "https://res.cloudinary.com/dj8fpb6tq/image/upload/v1758530649/qllwshtuqe3njr8pzim6.png" }, // Placeholder default
    },
    signature: {
      public_id: { type: String, default: null },
      url: { type: String, default: null },
    },
    username: String,
    refreshToken: { type: String, default: null, select: false },
    refreshTokenExpiry: { type: Date, default: null, select: false },
    activationCode: { type: String, default: null, select: false },
    activationCodeExpiry: { type: Date, default: null, select: false },
    lastActivationCodeSentAt: { type: Date, default: null, select: false },
    resetPasswordOtp: { type: String, default: null, select: false },
    resetPasswordOtpExpiry: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

const User = mongoose.model<IUser>("User", UserSchema);
export default User;