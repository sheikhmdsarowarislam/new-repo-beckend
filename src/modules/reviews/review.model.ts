import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  course: mongoose.Schema.Types.ObjectId;
  user: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
}

const ReviewSchema: Schema = new Schema(
  {
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

ReviewSchema.index({ course: 1 });
ReviewSchema.index({ user: 1 });

const ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);

export default ReviewModel;