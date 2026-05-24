import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseProgress extends Document {
  user: mongoose.Schema.Types.ObjectId;
  course: mongoose.Schema.Types.ObjectId;
  completedLectures: Map<string, boolean>;
  completedQuizzes: Map<string, { completed: boolean; score: number; completedAt: Date }>;
  lastViewedLecture?: mongoose.Schema.Types.ObjectId;
  totalLecturesCompleted: number;
  totalQuizzesCompleted: number;
  quizzesCompleted: boolean; // For backward compatibility - true when all quizzes completed
  averageQuizScore: number;
  isCourseCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CourseProgressSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
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
    lastViewedLecture: { type: Schema.Types.ObjectId, ref: 'Lecture' },
    totalLecturesCompleted: { type: Number, default: 0 },
    totalQuizzesCompleted: { type: Number, default: 0 },
    quizzesCompleted: { type: Boolean, default: false }, // For backward compatibility
    averageQuizScore: { type: Number, default: 0 },
    isCourseCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CourseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

const CourseProgress = mongoose.model<ICourseProgress>('CourseProgress', CourseProgressSchema);
export default CourseProgress;