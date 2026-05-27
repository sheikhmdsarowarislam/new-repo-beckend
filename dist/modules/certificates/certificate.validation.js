"use strict";
// src/modules/certificates/certificate.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCertificateStatsSchema = exports.verifyCertificateSchema = exports.getUserCertificatesSchema = exports.getCertificateByIdSchema = exports.getCertificateSchema = void 0;
const zod_1 = require("zod");
// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = zod_1.z.string()
    .nonempty('ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');
// Get Certificate Schema
exports.getCertificateSchema = zod_1.z.object({
    params: zod_1.z.object({
        courseId: objectIdSchema.describe("Course ID is required"),
    }),
});
// Get Certificate by ID Schema (using request body)
exports.getCertificateByIdSchema = zod_1.z.object({
    body: zod_1.z.object({
        certificateId: zod_1.z.string().nonempty("Certificate ID is required"),
    }),
});
// Get User Certificates Schema
exports.getUserCertificatesSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
    }).optional(),
});
// Verify Certificate Schema (using request body)
exports.verifyCertificateSchema = zod_1.z.object({
    body: zod_1.z.object({
        certificateId: zod_1.z.string().nonempty("Certificate ID is required"),
    }),
});
// Certificate Statistics Schema (admin only)
exports.getCertificateStatsSchema = zod_1.z.object({
    query: zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        courseId: objectIdSchema.optional(),
    }).optional(),
});
//# sourceMappingURL=certificate.validation.js.map