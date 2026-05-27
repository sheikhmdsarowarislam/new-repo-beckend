import mongoose, { Document } from 'mongoose';
export interface ICertificate extends Document {
    user: mongoose.Schema.Types.ObjectId;
    course: mongoose.Schema.Types.ObjectId;
    issueDate: Date;
    certificateId: string;
    downloadUrl: string;
}
declare const CertificateModel: mongoose.Model<ICertificate, {}, {}, {}, mongoose.Document<unknown, {}, ICertificate, {}, {}> & ICertificate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default CertificateModel;
//# sourceMappingURL=certificate.model.d.ts.map