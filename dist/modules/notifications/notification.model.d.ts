import mongoose, { Document } from 'mongoose';
export interface INotification extends Document {
    user: mongoose.Schema.Types.ObjectId;
    type: 'course_update' | 'new_review' | 'quiz_grade' | 'announcement' | 'enrollment' | 'course_completion' | 'certificate_earned' | 'payment_success' | 'payment_failed';
    message: string;
    isRead: boolean;
    relatedEntityId: mongoose.Schema.Types.ObjectId;
    priority?: 'high' | 'normal' | 'low';
    archived?: boolean;
    title?: string;
}
declare const NotificationModel: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default NotificationModel;
//# sourceMappingURL=notification.model.d.ts.map