import mongoose, { Schema, Document, Types } from 'mongoose';

// The Lecture model is the source of truth for all lecture details
export interface ILecture extends Document {
  title: string;
  course: Types.ObjectId;
  chapter: Types.ObjectId;
  videoUrl: string; // Source of truth for the URL
  duration: number;
  order: number;
  isPreview: boolean;
  resources?: string;
}

const LectureSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    chapter: { type: Schema.Types.ObjectId, ref: 'Chapter', required: true, index: true },
    videoUrl: { type: String, required: true },
    duration: { type: Number, required: true },
    order: { type: Number, required: true },
    isPreview: { type: Boolean, default: false },
    resources: { type: String }
  },
  { timestamps: true }
);

// Index for fast lookup by parent chapter and ordering
LectureSchema.index({ chapter: 1, order: 1 });

const Lecture = mongoose.model<ILecture>('Lecture', LectureSchema);
export default Lecture;