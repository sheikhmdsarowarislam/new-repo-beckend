import mongoose, { Document, Types } from 'mongoose';
export interface ILecture extends Document {
    title: string;
    course: Types.ObjectId;
    chapter: Types.ObjectId;
    videoUrl: string;
    duration: number;
    order: number;
    isPreview: boolean;
    resources?: string;
}
declare const Lecture: mongoose.Model<ILecture, {}, {}, {}, mongoose.Document<unknown, {}, ILecture, {}, {}> & ILecture & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Lecture;
//# sourceMappingURL=lecture.model.d.ts.map