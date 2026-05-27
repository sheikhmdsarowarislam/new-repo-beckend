import { ServiceResponse } from "../../@types/api";
/**
 * Get user certificate for a course
 */
export declare const getUserCertificateService: (userId: string, courseId: string) => Promise<ServiceResponse<any>>;
/**
 * Get all user certificates
 */
export declare const getUserCertificatesService: (userId: string, options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get certificate by certificate ID (for verification)
 */
export declare const getCertificateByIdService: (certificateId: string) => Promise<ServiceResponse<any>>;
/**
 * Verify certificate authenticity
 */
export declare const verifyCertificateService: (certificateId: string) => Promise<ServiceResponse<any>>;
/**
 * Get certificate statistics
 */
export declare const getCertificateStatsService: (options?: any) => Promise<ServiceResponse<any>>;
/**
 * Get certificate for download by certificate ID
 */
export declare const getCertificateForDownload: (certificateId: string) => Promise<ServiceResponse<any>>;
//# sourceMappingURL=certificate.service.d.ts.map