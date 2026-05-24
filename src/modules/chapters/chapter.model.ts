import mongoose, { Schema, Document, Types } from 'mongoose';

// The Chapter model acts as the ordered container for lectures and quizzes
export interface IChapter extends Document {
  title: string;
  course: Types.ObjectId;
  order: number;
  chapterDuration: number;
}

const ChapterSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    order: { type: Number, required: true },
    chapterDuration: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Compound index for course structure and ordering
ChapterSchema.index({ course: 1, order: 1 });

const Chapter = mongoose.model<IChapter>("Chapter", ChapterSchema);
export default Chapter;