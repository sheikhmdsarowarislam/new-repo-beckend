"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const enrollmentSchema = new mongoose_1.Schema({
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose_1.Schema.Types.ObjectId, ref: "Course" },
    tool: { type: mongoose_1.Schema.Types.ObjectId, ref: "Tool" },
    itemType: { type: String, enum: ["course", "tool"], required: true, default: "course" },
    coupon: { type: mongoose_1.Schema.Types.ObjectId, ref: "Coupon" },
    enrollmentDate: { type: Date, default: Date.now },
    paymentStatus: {
        type: String,
        enum: ["pending", "free", "paid", "rejected", "canceled", "expired"],
        default: "pending",
    },
    amountPaid: { type: Number, default: 0 },
    paymentMethod: {
        type: String,
        enum: ["bkash", "free", "stripe"],
        default: "bkash",
    },
    transactionId: { type: String },
    paymentProof: { type: String },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    stripeSessionId: { type: String },
    validUntil: { type: Date, default: null },
    sourcePackage: { type: mongoose_1.Schema.Types.ObjectId, ref: "Tool", default: null },
}, { timestamps: true });
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true, sparse: true, partialFilterExpression: { course: { $exists: true } } });
enrollmentSchema.index({ student: 1, tool: 1 }, {
    unique: true,
    sparse: true,
    partialFilterExpression: { paymentStatus: { $in: ["paid", "free", "pending"] } }
});
enrollmentSchema.index({ student: 1, enrollmentDate: -1 });
enrollmentSchema.index({ paymentStatus: 1, enrollmentDate: -1 });
enrollmentSchema.index({ transactionId: 1 });
enrollmentSchema.index({ validUntil: 1 });
const Enrollment = mongoose_1.default.model("Enrollment", enrollmentSchema);
exports.default = Enrollment;
//# sourceMappingURL=enrollment.model.js.map