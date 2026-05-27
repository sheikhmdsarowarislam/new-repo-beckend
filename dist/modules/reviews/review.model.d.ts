import mongoose, { Document } from 'mongoose';
export interface IReview extends Document {
    course: mongoose.Schema.Types.ObjectId;
    user: mongoose.Schema.Types.ObjectId;
    rating: number;
    comment: string;
}
declare const ReviewModel: mongoose.Model<IReview, {}, {}, {}, mongoose.Document<unknown, {}, IReview, {}, {}> & IReview & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default ReviewModel;
//# sourceMappingURL=review.model.d.ts.map