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
const CourseSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    stacks: {
        type: [String],
        default: [],
    },
    thumbnail: {
        public_id: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            default: "https://res.cloudinary.com/dj8fpb6tq/image/upload/v1758530649/qllwshtuqe3njr8pzim6.png",
        },
    },
    category: { type: String, required: true },
    instructor: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    requirements: [String],
    whatYouWillLearn: [String],
    totalDuration: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft",
    },
}, { timestamps: true, strict: true });
CourseSchema.index({ title: "text", description: "text" });
CourseSchema.index({ instructor: 1 });
const Course = mongoose_1.default.model("Course", CourseSchema);
exports.default = Course;
//# sourceMappingURL=course.model.js.map