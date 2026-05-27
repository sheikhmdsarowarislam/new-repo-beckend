import mongoose, { Document, Types } from 'mongoose';
export interface IChapter extends Document {
    title: string;
    course: Types.ObjectId;
    order: number;
    chapterDuration: number;
}
declare const Chapter: mongoose.Model<IChapter, {}, {}, {}, mongoose.Document<unknown, {}, IChapter, {}, {}> & IChapter & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default Chapter;
//# sourceMappingURL=chapter.model.d.ts.map