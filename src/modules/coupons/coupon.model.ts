import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountValue: number;
  appliesTo: "all" | mongoose.Types.ObjectId; 
  expiresAt?: Date;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    discountValue: { type: Number, required: true, min: 1, max: 100 },
    appliesTo: { type: Schema.Types.Mixed, required: true, default: "all" },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema)
export default Coupon;