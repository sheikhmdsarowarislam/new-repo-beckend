export interface CertificateData {
    studentName: string;
    courseTitle: string;
    instructorName: string;
    certificateId: string;
    issueDate: string;
    completionDate: string;
    instructorSignatureUrl?: string;
    adminSignatureUrl?: string;
    adminName?: string;
}
export declare const generateCertificatePDFKit: (data: CertificateData) => Promise<Buffer>;
//# sourceMappingURL=pdfGenerator.d.ts.map