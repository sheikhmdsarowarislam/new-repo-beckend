import mongoose, { Schema, Document } from "mongoose";

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

const enrollmentSchema = new Schema<IEnrollment>(
  {
    student:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    course:   { type: Schema.Types.ObjectId, ref: "Course" },
    tool:     { type: Schema.Types.ObjectId, ref: "Tool" },
    itemType: { type: String, enum: ["course", "tool"], required: true, default: "course" },
    coupon:   { type: Schema.Types.ObjectId, ref: "Coupon" },
    enrollmentDate: { type: Date, default: Date.now },

    paymentStatus: {
      type: String,
      enum: ["pending", "free", "paid", "rejected", "canceled", "expired"],
      default: "pending",
    },
    amountPaid:  { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["bkash", "free", "stripe"],
      default: "bkash",
    },
    transactionId:   { type: String },
    paymentProof:    { type: String },
    approvedBy:      { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt:      { type: Date },
    rejectedAt:      { type: Date },
    rejectionReason: { type: String },
    stripeSessionId: { type: String },
    validUntil:      { type: Date, default: null },
    sourcePackage:   { type: Schema.Types.ObjectId, ref: "Tool", default: null },
  },
  { timestamps: true }
);

enrollmentSchema.index(
  { student: 1, course: 1 },
  { unique: true, sparse: true, partialFilterExpression: { course: { $exists: true } } }
);
enrollmentSchema.index(
  { student: 1, tool: 1 },
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { paymentStatus: { $in: ["paid", "free", "pending"] } }
  }
);
enrollmentSchema.index({ student: 1, enrollmentDate: -1 });
enrollmentSchema.index({ paymentStatus: 1, enrollmentDate: -1 });
enrollmentSchema.index({ transactionId: 1 });
enrollmentSchema.index({ validUntil: 1 });

const Enrollment = mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);
export default Enrollment;