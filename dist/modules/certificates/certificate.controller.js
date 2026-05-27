"use strict";
// src/modules/certificates/certificate.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadCertificateHandler = exports.getCertificateStatsHandler = exports.verifyCertificateHandler = exports.getCertificateByIdHandler = exports.getUserCertificatesHandler = exports.getUserCertificateHandler = void 0;
const certificateService = __importStar(require("./certificate.service"));
const catchAsync_1 = require("../../middlewares/catchAsync");
const pdfGenerator_1 = require("../../utils/pdfGenerator");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// --- CONTROLLER HANDLERS ---
exports.getUserCertificateHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    if (!req.params.courseId) {
        return (0, response_1.sendError)(res, 'Course ID missing', 400);
    }
    const result = await certificateService.getUserCertificateService(userId, req.params.courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Certificate not found', 404, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Certificate retrieved successfully');
});
exports.getUserCertificatesHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const { page, limit } = (0, common_1.getPaginationParams)(req);
    const options = {
        page,
        limit
    };
    const result = await certificateService.getUserCertificatesService(userId, options);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve certificates', 500, result.errors);
    }
    const { certificates, pagination } = result.data;
    return (0, response_1.sendPaginated)(res, certificates, pagination, 'Certificates retrieved successfully');
});
exports.getCertificateByIdHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.body.certificateId) {
        return (0, response_1.sendError)(res, 'Certificate ID missing', 400);
    }
    const result = await certificateService.getCertificateByIdService(req.body.certificateId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Certificate not found', 404, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Certificate retrieved successfully');
});
exports.verifyCertificateHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    if (!req.body.certificateId) {
        return (0, response_1.sendError)(res, 'Certificate ID missing', 400);
    }
    const result = await certificateService.verifyCertificateService(req.body.certificateId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Certificate verification failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Certificate verification completed');
});
exports.getCertificateStatsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    // Only admins can view certificate statistics
    if (userRole !== 'admin') {
        return (0, response_1.sendError)(res, 'Insufficient permissions', 403);
    }
    const { startDate, endDate, courseId } = req.query;
    const options = {
        startDate,
        endDate,
        courseId
    };
    const result = await certificateService.getCertificateStatsService(options);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve certificate stats', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Certificate stats retrieved successfully');
});
// Download certificate as PDF
exports.downloadCertificateHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { certificateId } = req.params;
    if (!certificateId) {
        return (0, response_1.sendError)(res, 'Certificate ID is required', 400);
    }
    try {
        // Get certificate data
        const result = await certificateService.getCertificateForDownload(certificateId);
        if (!result.success || !result.data) {
            return (0, response_1.sendError)(res, 'Certificate not found', 404);
        }
        const certificate = result.data;
        // Prepare certificate data for PDF generation
        const instructorSignatureUrl = certificate.course?.instructor?.signature?.url;
        const adminSignatureUrl = process.env.PLATFORM_ADMIN_SIGNATURE_URL;
        const certificateData = {
            studentName: certificate.user.name,
            courseTitle: certificate.course.title,
            instructorName: certificate.course.instructor?.name || "Course Instructor",
            certificateId: certificate.certificateId,
            issueDate: new Date(certificate.issueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            completionDate: new Date(certificate.issueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            instructorSignatureUrl: instructorSignatureUrl,
            adminSignatureUrl: adminSignatureUrl,
            adminName: 'Platform Administrator'
        };
        // Generate PDF using PDFKit (serverless compatible)
        let pdfBuffer;
        try {
            console.log('Generating certificate PDF with PDFKit...');
            pdfBuffer = await (0, pdfGenerator_1.generateCertificatePDFKit)(certificateData);
            console.log('PDF generation successful');
        }
        catch (error) {
            console.error('PDF generation failed:', {
                error: error.message,
                certificateId: certificate.certificateId,
                studentName: certificateData.studentName
            });
            return (0, response_1.sendError)(res, `Failed to generate certificate PDF: ${error.message}`, 500);
        }
        // Check if PDF buffer was successfully generated
        if (!pdfBuffer) {
            return (0, response_1.sendError)(res, 'Failed to generate certificate PDF after all attempts', 500);
        }
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        // Send PDF buffer
        res.send(pdfBuffer);
    }
    catch (error) {
        console.error('Certificate download error:', {
            message: error.message,
            stack: error.stack,
            certificateId: req.params.certificateId
        });
        return (0, response_1.sendError)(res, 'Failed to process certificate download request', 500);
    }
});
//# sourceMappingURL=certificate.controller.js.map