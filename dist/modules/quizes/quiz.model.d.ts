import mongoose, { Document, Types } from 'mongoose';
export interface IQuiz extends Document {
    course: Types.ObjectId;
    chapter: Types.ObjectId;
    title: string;
    order: number;
    duration: number;
    questions: {
        questionText: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }[];
}
declare const QuizModel: mongoose.Model<IQuiz, {}, {}, {}, mongoose.Document<unknown, {}, IQuiz, {}, {}> & IQuiz & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default QuizModel;
//# sourceMappingURL=quiz.model.d.ts.map