import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscussion extends Document {
  user: mongoose.Schema.Types.ObjectId;
  lecture: mongoose.Schema.Types.ObjectId;
  course: mongoose.Schema.Types.ObjectId;
  question: string;
  answers: {
    user: mongoose.Schema.Types.ObjectId;
    text: string;
    isInstructorAnswer: boolean;
  }[];
}

const DiscussionSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lecture: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    question: { type: String, required: true },
    answers: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        isInstructorAnswer: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

DiscussionSchema.index({ lecture: 1 });
DiscussionSchema.index({ user: 1 });
const DiscussionModel = mongoose.model<IDiscussion>('Discussion', DiscussionSchema);

export default DiscussionModel;