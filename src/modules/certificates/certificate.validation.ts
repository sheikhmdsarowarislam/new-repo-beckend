// src/modules/certificates/certificate.validation.ts

import { z } from 'zod';

// Base Zod validator for MongoDB ObjectId format
const objectIdSchema = z.string()
  .nonempty('ID is required')
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format. Must be a 24-character ObjectId.');

// Get Certificate Schema
export const getCertificateSchema = z.object({
  params: z.object({
    courseId: objectIdSchema.describe("Course ID is required"),
  }),
});

// Get Certificate by ID Schema (using request body)
export const getCertificateByIdSchema = z.object({
  body: z.object({
    certificateId: z.string().nonempty("Certificate ID is required"),
  }),
});

// Get User Certificates Schema
export const getUserCertificatesSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }).optional(),
});

// Verify Certificate Schema (using request body)
export const verifyCertificateSchema = z.object({
  body: z.object({
    certificateId: z.string().nonempty("Certificate ID is required"),
  }),
});

// Certificate Statistics Schema (admin only)
export const getCertificateStatsSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    courseId: objectIdSchema.optional(),
  }).optional(),
});
