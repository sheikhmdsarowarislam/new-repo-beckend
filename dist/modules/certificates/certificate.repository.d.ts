import { ClientSession } from 'mongoose';
import { ICertificate } from './certificate.model';
export declare const findCertificateById: (certificateId: string, session?: ClientSession) => Promise<any>;
export declare const findCertificateByUserAndCourse: (userId: string, courseId: string, session?: ClientSession) => Promise<any>;
export declare const findCertificatesByUser: (userId: string, options?: any, session?: ClientSession) => Promise<any[]>;
export declare const createCertificate: (data: Partial<ICertificate>, session?: ClientSession) => Promise<ICertificate>;
export declare const deleteCertificateById: (certificateId: string, session?: ClientSession) => Promise<any>;
//# sourceMappingURL=certificate.repository.d.ts.map