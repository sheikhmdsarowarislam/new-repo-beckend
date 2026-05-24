import mongoose, { Schema, Document } from 'mongoose';

export interface ICertificate extends Document {
  user: mongoose.Schema.Types.ObjectId;
  course: mongoose.Schema.Types.ObjectId;
  issueDate: Date;
  certificateId: string;
  downloadUrl: string;
}

const CertificateSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    issueDate: { type: Date, default: Date.now },
    certificateId: { type: String, required: true, unique: true },
    downloadUrl: { type: String, required: true }
  },
  { timestamps: true }
);

CertificateSchema.index({ user: 1, course: 1 }, { unique: true });

const CertificateModel = mongoose.model<ICertificate>('Certificate', CertificateSchema);
export default CertificateModel;