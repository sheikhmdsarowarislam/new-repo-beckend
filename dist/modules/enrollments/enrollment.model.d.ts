import mongoose, { Document } from "mongoose";
export interface IEnrollment extends Document {
    student: mongoose.Types.ObjectId;
    course?: mongoose.Types.ObjectId;
    tool?: mongoose.Types.ObjectId;
    itemType: "course" | "tool";
    coupon?: mongoose.Types.ObjectId;
    enrollmentDate: Date;
    amountPaid: number;
    paymentStatus: "pending" | "free" | "paid" | "rejected" | "canceled" | "expired";
    paymentMethod: "bkash" | "free" | "stripe";
    transactionId?: string;
    paymentProof?: string;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    stripeSessionId?: string;
    validUntil?: Date;
    sourcePackage?: mongoose.Types.ObjectId;
}
declare const Enrollment: mongoose.Model<IEnrollment, {}, {}, {}, mongoose.Document<unknown, {}, IEnrollment, {}, {}> & IEnrollment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Enrollment;
//# sourceMappingURL=enrollment.model.d.ts.map