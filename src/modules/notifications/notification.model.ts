import mongoose, { Schema, Document } from 'mongoose';

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

const NotificationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    relatedEntityId: { type: Schema.Types.ObjectId },
    priority: { type: String, enum: ['high', 'normal', 'low'], default: 'normal' },
    archived: { type: Boolean, default: false },
    title: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ user: 1, archived: 1 });
NotificationSchema.index({ user: 1, priority: 1 });
NotificationSchema.index({ relatedEntityId: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });


const NotificationModel =  mongoose.model<INotification>('Notification', NotificationSchema);
export default  NotificationModel;