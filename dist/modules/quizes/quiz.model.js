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
const QuizSchema = new mongoose_1.Schema({
    course: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    chapter: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    duration: { type: Number, default: 600 }, // Duration in seconds, default 10 minutes
    questions: [
        {
            questionText: { type: String, required: true },
            options: [{ type: String, required: true }],
            correctAnswer: { type: Number, required: true },
            explanation: String,
        },
    ],
}, { timestamps: true });
// Compound indexes for optimized queries
QuizSchema.index({ chapter: 1, order: 1 }); // For chapter-based ordering
QuizSchema.index({ course: 1, order: 1 }); // For course-based ordering  
QuizSchema.index({ course: 1, chapter: 1 }); // For course-chapter filtering
QuizSchema.index({ createdAt: -1 }); // For recent quizzes
QuizSchema.index({ updatedAt: -1 }); // For recently updated quizzes
QuizSchema.index({ 'questions.correctAnswer': 1 }); // For quiz analytics
QuizSchema.index({ title: 'text' }); // For text search on quiz titles
const QuizModel = mongoose_1.default.model("Quiz", QuizSchema);
exports.default = QuizModel;
//# sourceMappingURL=quiz.model.js.map