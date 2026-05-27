import mongoose, { Document } from 'mongoose';
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
declare const DiscussionModel: mongoose.Model<IDiscussion, {}, {}, {}, mongoose.Document<unknown, {}, IDiscussion, {}, {}> & IDiscussion & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default DiscussionModel;
//# sourceMappingURL=discussion.model.d.ts.map