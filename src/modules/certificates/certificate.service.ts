import { Types } from 'mongoose';
import { getCache, setCache, invalidateCache } from "../../utils/cache";
import Certificate, { ICertificate } from "./certificate.model";
import { ServiceResponse } from "../../@types/api";

// --- CORE SERVICE FUNCTIONS ---

/**
 * Get user certificate for a course
 */
export const getUserCertificateService = async (
    userId: string, 
    courseId: string
): Promise<ServiceResponse<any>> => {
    try {
        const cacheKey = `certificate:${userId}:${courseId}`;
        const cached = await getCache(cacheKey);
        
        if (cached) {
            return {
                success: true,
                data: cached,
                message: 'Certificate retrieved from cache'
            };
        }
        
        const certificate = await Certificate.findOne({ user: userId, course: courseId })
            .populate('course', 'title instructor')
            .populate('user', 'name email')
            .lean();

        if (!certificate) {
            return {
                success: false,
                message: 'Certificate not found',
                errors: ['No certificate found for the specified user and course']
            };
        }

        await setCache(cacheKey, certificate, 3600);

        return {
            success: true,
            data: { certificate },
            message: 'Certificate retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve certificate',
            errors: [error.message]
        };
    }
};

/**
 * Get all user certificates
 */
export const getUserCertificatesService = async (
  userId: string, 
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;

        const certificates = await Certificate.find({ user: userId })
            .populate('course', 'title thumbnail instructor')
            .sort({ issueDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Certificate.countDocuments({ user: userId });

        const responseData = {
            certificates,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
        
        return {
            success: true,
            data: responseData,
            message: 'User certificates retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve user certificates',
            errors: [error.message]
        };
    }
};

/**
 * Get certificate by certificate ID (for verification)
 */
export const getCertificateByIdService = async (
  certificateId: string
): Promise<ServiceResponse<any>> => {
    try {
        const certificate = await Certificate.findOne({ certificateId })
            .populate('course', 'title instructor')
            .populate('user', 'name email')
            .lean();

        if (!certificate) {
            return {
                success: false,
                message: 'Certificate not found',
                errors: ['No certificate found with the provided ID']
            };
        }
        
        return {
            success: true,
            data: { certificate },
            message: 'Certificate retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve certificate',
            errors: [error.message]
        };
    }
};

/**
 * Verify certificate authenticity
 */
export const verifyCertificateService = async (certificateId: string): Promise<ServiceResponse<any>> => {
    try {
        const certificate = await Certificate.findOne({ certificateId })
            .populate('course', 'title')
            .populate('user', 'name')
            .lean();

        if (!certificate) {
            return {
                success: false,
                message: 'Certificate not found',
                errors: ['No certificate found with the provided ID']
            };
        }

        return {
            success: true,
            data: {
                valid: true,
                certificate: {
                    id: certificate.certificateId,
                    student: (certificate.user as any).name,
                    course: (certificate.course as any).title,
                    issueDate: certificate.issueDate
                }
            },
            message: 'Certificate verification completed'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Certificate verification failed',
            errors: [error.message]
        };
    }
};

/**
 * Get certificate statistics
 */
export const getCertificateStatsService = async (
  options: any = {}
): Promise<ServiceResponse<any>> => {
    try {
        const { startDate, endDate, courseId } = options;
        
        const matchStage: any = {};
        if (startDate || endDate) {
            matchStage.issueDate = {};
            if (startDate) matchStage.issueDate.$gte = new Date(startDate);
            if (endDate) matchStage.issueDate.$lte = new Date(endDate);
        }
        if (courseId) matchStage.course = new Types.ObjectId(courseId);

        const pipeline: any[] = [];
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        // OPTIMIZATION: Enhanced aggregation pipeline with better performance
        const stats = await Certificate.aggregate([
            ...pipeline,
            {
                $group: {
                    _id: null,
                    totalCertificates: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$user" },
                    uniqueCourses: { $addToSet: "$course" }
                }
            },
            {
                $addFields: {
                    uniqueUserCount: { $size: "$uniqueUsers" },
                    uniqueCourseCount: { $size: "$uniqueCourses" }
                }
            },
            {
                $project: {
                    totalCertificates: 1,
                    uniqueUserCount: 1,
                    uniqueCourseCount: 1,
                    _id: 0 // OPTIMIZATION: Exclude _id field
                }
            }
        ]);

        const result = stats.length > 0 ? stats[0] : {
            totalCertificates: 0,
            uniqueUserCount: 0,
            uniqueCourseCount: 0
        };

        const responseData = { stats: result };
        
        return {
            success: true,
            data: responseData,
            message: 'Certificate stats retrieved successfully'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve certificate stats',
            errors: [error.message]
        };
    }
};


/**
 * Get certificate for download by certificate ID
 */
export const getCertificateForDownload = async (certificateId: string): Promise<ServiceResponse<any>> => {
    try {
        const certificate = await Certificate.findOne({ certificateId })
            .populate({
                path: 'course',
                select: 'title instructor',
                populate: { path: 'instructor', select: 'name signature role' }
            })
            .populate('user', 'name email')
            .lean();

        if (!certificate) {
            return {
                success: false,
                message: 'Certificate not found',
                errors: ['No certificate found with the provided ID']
            };
        }

        return {
            success: true,
            data: certificate,
            message: 'Certificate retrieved for download'
        };
    } catch (error: any) {
        return {
            success: false,
            message: 'Failed to retrieve certificate for download',
            errors: [error.message]
        };
    }
};
