import mongoose, { Schema, Document, Types } from 'mongoose';

// The Quiz model is the source of truth for all quiz questions and answers
export interface IQuiz extends Document {
  course: Types.ObjectId;
  chapter: Types.ObjectId;
  title: string;
  order: number;
  duration: number;
  questions: {
    questionText: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
  }[];
}

const QuizSchema: Schema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    chapter: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
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
  },
  { timestamps: true }
);

// Compound indexes for optimized queries
QuizSchema.index({ chapter: 1, order: 1 }); // For chapter-based ordering
QuizSchema.index({ course: 1, order: 1 }); // For course-based ordering  
QuizSchema.index({ course: 1, chapter: 1 }); // For course-chapter filtering
QuizSchema.index({ createdAt: -1 }); // For recent quizzes
QuizSchema.index({ updatedAt: -1 }); // For recently updated quizzes
QuizSchema.index({ 'questions.correctAnswer': 1 }); // For quiz analytics
QuizSchema.index({ title: 'text' }); // For text search on quiz titles

const QuizModel = mongoose.model<IQuiz>("Quiz", QuizSchema);
export default QuizModel;