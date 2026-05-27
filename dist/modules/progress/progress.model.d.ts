import mongoose, { Document } from 'mongoose';
export interface ICourseProgress extends Document {
    user: mongoose.Schema.Types.ObjectId;
    course: mongoose.Schema.Types.ObjectId;
    completedLectures: Map<string, boolean>;
    completedQuizzes: Map<string, {
        completed: boolean;
        score: number;
        completedAt: Date;
    }>;
    lastViewedLecture?: mongoose.Schema.Types.ObjectId;
    totalLecturesCompleted: number;
    totalQuizzesCompleted: number;
    quizzesCompleted: boolean;
    averageQuizScore: number;
    isCourseCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const CourseProgress: mongoose.Model<ICourseProgress, {}, {}, {}, mongoose.Document<unknown, {}, ICourseProgress, {}, {}> & ICourseProgress & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default CourseProgress;
//# sourceMappingURL=progress.model.d.ts.map