import mongoose, { Document } from "mongoose";
export interface ICoupon extends Document {
    code: string;
    discountValue: number;
    appliesTo: "all" | mongoose.Types.ObjectId;
    expiresAt?: Date;
    isActive: boolean;
    usageLimit?: number;
    usageCount: number;
}
declare const Coupon: mongoose.Model<ICoupon, {}, {}, {}, mongoose.Document<unknown, {}, ICoupon, {}, {}> & ICoupon & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Coupon;
//# sourceMappingURL=coupon.model.d.ts.map