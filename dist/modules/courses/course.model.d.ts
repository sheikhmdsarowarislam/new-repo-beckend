import mongoose, { Document } from "mongoose";
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
declare const Course: mongoose.Model<ICourse, {}, {}, {}, mongoose.Document<unknown, {}, ICourse, {}, {}> & ICourse & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Course;
//# sourceMappingURL=course.model.d.ts.map