// src/modules/certificates/certificate.routes.ts

import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getUserCertificateHandler,
  getUserCertificatesHandler,
  getCertificateByIdHandler,
  verifyCertificateHandler,
  getCertificateStatsHandler,
  downloadCertificateHandler,
} from "./certificate.controller";
import {
  getCertificateSchema,
  getCertificateByIdSchema,
  getUserCertificatesSchema,
  verifyCertificateSchema,
  getCertificateStatsSchema,
} from "./certificate.validation";

const router = Router();

// --- READ ROUTES ---

// GET user's certificate for specific course
router.get(
    "/course/:courseId", 
    isAuthenticated,
    rbac('certificate:read'),
    validate(getCertificateSchema),
    getUserCertificateHandler
);

// GET all user certificates (authenticated user)
router.get(
    "/", 
    isAuthenticated,
    rbac('certificate:read'),
    validate(getUserCertificatesSchema),
    getUserCertificatesHandler
);

// POST certificate by certificate ID (using request body)
router.post(
    "/view", 
    isAuthenticated,
    rbac('certificate:read'),
    validate(getCertificateByIdSchema),
    getCertificateByIdHandler
);

// POST certificate verification (using request body)
router.post(
    "/verify", 
    isAuthenticated,
    rbac('certificate:verify'),
    validate(verifyCertificateSchema),
    verifyCertificateHandler
);

// GET certificate statistics (admin only)
router.get(
    "/stats", 
    isAuthenticated,
    rbac('certificate:stats'),
    validate(getCertificateStatsSchema),
    getCertificateStatsHandler
);

// GET download certificate PDF (public route)
router.get(
    "/download/:certificateId", 
    downloadCertificateHandler
);

export default router;
