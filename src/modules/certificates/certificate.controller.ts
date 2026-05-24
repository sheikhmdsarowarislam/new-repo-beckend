// src/modules/certificates/certificate.controller.ts

import { Request, Response } from "express";
import * as certificateService from "./certificate.service";
import { catchAsync } from "../../middlewares/catchAsync";
import { generateCertificatePDFKit, CertificateData } from "../../utils/pdfGenerator";
import { getUserId, getUserRole, getPaginationParams } from "../../utils/common";
import { sendSuccess, sendError, sendPaginated } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth";

// --- Type Definitions ---
interface CertificateAuthRequest extends AuthRequest {
    params: {
        courseId?: string;
        certificateId?: string;
    };
    query: {
        page?: string;
        limit?: string;
        startDate?: string;
        endDate?: string;
        courseId?: string;
    };
    body: any; 
}

// --- CONTROLLER HANDLERS ---

export const getUserCertificateHandler = catchAsync(async (req: CertificateAuthRequest, res: Response) => {
    const userId = getUserId(req);
    
    if (!req.params.courseId) {
        return sendError(res, 'Course ID missing', 400);
    }

    const result = await certificateService.getUserCertificateService(
        userId,
        req.params.courseId
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Certificate not found', 404, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Certificate retrieved successfully');
});

export const getUserCertificatesHandler = catchAsync(async (req: CertificateAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const { page, limit } = getPaginationParams(req);

    const options = {
        page,
        limit
    };

    const result = await certificateService.getUserCertificatesService(
        userId,
        options
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve certificates', 500, result.errors);
    }
    
    const { certificates, pagination } = result.data!;
    return sendPaginated(res, certificates, pagination, 'Certificates retrieved successfully');
});

export const getCertificateByIdHandler = catchAsync(async (req: CertificateAuthRequest, res: Response) => {
    if (!req.body.certificateId) {
        return sendError(res, 'Certificate ID missing', 400);
    }

    const result = await certificateService.getCertificateByIdService(
        req.body.certificateId
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Certificate not found', 404, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Certificate retrieved successfully');
});

export const verifyCertificateHandler = catchAsync(async (req: CertificateAuthRequest, res: Response) => {
    if (!req.body.certificateId) {
        return sendError(res, 'Certificate ID missing', 400);
    }

    const result = await certificateService.verifyCertificateService(
        req.body.certificateId
    );
    
    if (!result.success) {
        return sendError(res, result.message || 'Certificate verification failed', 400, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Certificate verification completed');
});

export const getCertificateStatsHandler = catchAsync(async (req: CertificateAuthRequest, res: Response) => {
    const userId = getUserId(req);
    const userRole = getUserRole(req);
    
    // Only admins can view certificate statistics
    if (userRole !== 'admin') {
        return sendError(res, 'Insufficient permissions', 403);
    }

    const { startDate, endDate, courseId } = req.query;
    const options = {
        startDate,
        endDate,
        courseId
    };

    const result = await certificateService.getCertificateStatsService(options);
    
    if (!result.success) {
        return sendError(res, result.message || 'Failed to retrieve certificate stats', 500, result.errors);
    }
    
    return sendSuccess(res, result.data, 'Certificate stats retrieved successfully');
});

// Download certificate as PDF
export const downloadCertificateHandler = catchAsync(async (req: Request, res: Response) => {
    const { certificateId } = req.params;
    
    if (!certificateId) {
        return sendError(res, 'Certificate ID is required', 400);
    }

    try {
        // Get certificate data
        const result = await certificateService.getCertificateForDownload(certificateId);
        
        if (!result.success || !result.data) {
            return sendError(res, 'Certificate not found', 404);
        }

        const certificate = result.data;

        // Prepare certificate data for PDF generation
        const instructorSignatureUrl = (certificate.course as any)?.instructor?.signature?.url as string | undefined;
        const adminSignatureUrl = process.env.PLATFORM_ADMIN_SIGNATURE_URL;

        const certificateData: CertificateData = {
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
        let pdfBuffer: Buffer | undefined;
        
        try {
            console.log('Generating certificate PDF with PDFKit...');
            pdfBuffer = await generateCertificatePDFKit(certificateData);
            console.log('PDF generation successful');
        } catch (error: any) {
            console.error('PDF generation failed:', {
                error: error.message,
                certificateId: certificate.certificateId,
                studentName: certificateData.studentName
            });
            
            return sendError(res, 
                `Failed to generate certificate PDF: ${error.message}`, 
                500
            );
        }
        
        // Check if PDF buffer was successfully generated
        if (!pdfBuffer) {
            return sendError(res, 'Failed to generate certificate PDF after all attempts', 500);
        }
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificate-${certificate.certificateId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Send PDF buffer
        res.send(pdfBuffer);
    } catch (error: any) {
        console.error('Certificate download error:', {
            message: error.message,
            stack: error.stack,
            certificateId: req.params.certificateId
        });
        return sendError(res, 'Failed to process certificate download request', 500);
    }
});
