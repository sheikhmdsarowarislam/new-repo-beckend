import { z } from 'zod';
export declare const getCertificateSchema: z.ZodObject<{
    params: z.ZodObject<{
        courseId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getCertificateByIdSchema: z.ZodObject<{
    body: z.ZodObject<{
        certificateId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getUserCertificatesSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        page: z.ZodOptional<z.ZodString>;
        limit: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const verifyCertificateSchema: z.ZodObject<{
    body: z.ZodObject<{
        certificateId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const getCertificateStatsSchema: z.ZodObject<{
    query: z.ZodOptional<z.ZodObject<{
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        courseId: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
//# sourceMappingURL=certificate.validation.d.ts.map