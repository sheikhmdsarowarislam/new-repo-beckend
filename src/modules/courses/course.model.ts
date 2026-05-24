import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  title: string;
  description: string;
  price: number;
  discount: number;
  stacks: string[];
  thumbnail: {
    public_id: string | null;
    url: string;
  };
  category: string;
  instructor: mongoose.Schema.Types.ObjectId;
  level: "beginner" | "intermediate" | "advanced";
  requirements: string[];
  whatYouWillLearn: string[];
  totalDuration: number;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  status: "draft" | "published" | "archived";
}

const CourseSchema: Schema = new Schema(
  {
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
        default:
          "https://res.cloudinary.com/dj8fpb6tq/image/upload/v1758530649/qllwshtuqe3njr8pzim6.png",
      },
    },
    category: { type: String, required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
  },
  { timestamps: true, strict: true }
);

CourseSchema.index({ title: "text", description: "text" });
CourseSchema.index({ instructor: 1 });

const Course = mongoose.model<ICourse>("Course", CourseSchema);
export default Course;
