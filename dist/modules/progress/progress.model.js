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
const CourseProgressSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedLectures: { type: Map, of: Boolean, default: {} },
    completedQuizzes: {
        type: Map,
        of: {
            completed: { type: Boolean, required: true },
            score: { type: Number, required: true },
            completedAt: { type: Date, required: true }
        },
        default: {}
    },
    lastViewedLecture: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Lecture' },
    totalLecturesCompleted: { type: Number, default: 0 },
    totalQuizzesCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Boolean, default: false }, // For backward compatibility
    averageQuizScore: { type: Number, default: 0 },
    isCourseCompleted: { type: Boolean, default: false },
}, { timestamps: true });
CourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });
const CourseProgress = mongoose_1.default.model('CourseProgress', CourseProgressSchema);
exports.default = CourseProgress;
//# sourceMappingURL=progress.model.js.map