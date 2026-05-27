"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelEnrollmentController = exports.getAllEnrollmentsController = exports.checkToolEnrollmentController = exports.submitToolPaymentController = exports.getStudentsByInstructorController = exports.getInstructorDashboardController = exports.checkEnrollmentController = exports.getEnrolledCourseController = exports.getEnrolledCoursesController = exports.rejectEnrollmentController = exports.approveEnrollmentController = exports.getPendingEnrollmentsController = exports.submitPaymentController = exports.getUserToolsController = void 0;
const catchAsync_1 = require("../../middlewares/catchAsync");
const enrollment_model_1 = __importDefault(require("./enrollment.model"));
const tool_model_1 = __importDefault(require("../tools/tool.model"));
const enrollment_service_1 = require("./enrollment.service");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
exports.getUserToolsController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const result = await (0, enrollment_service_1.getUserTools)(userId);
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 500, result.errors);
    return (0, response_1.sendSuccess)(res, result.data, "User tools retrieved");
});
exports.submitPaymentController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId, transactionId, couponCode } = req.body;
    const studentId = (0, common_1.getUserId)(req);
    if (!transactionId || !transactionId.trim()) {
        return (0, response_1.sendError)(res, "Transaction ID or mobile number is required.", 400);
    }
    const result = await (0, enrollment_service_1.submitManualPayment)({ studentId, courseId, transactionId, couponCode });
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Payment submission failed", 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, result.message || "Payment submitted successfully");
});
exports.getPendingEnrollmentsController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    if (userRole !== "admin") {
        return (0, response_1.sendError)(res, "Unauthorized. Admin access required.", 403);
    }
    const result = await (0, enrollment_service_1.getPendingEnrollments)();
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Failed to retrieve pending enrollments", 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, "Pending enrollments retrieved successfully");
});
exports.approveEnrollmentController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    if (userRole !== "admin") {
        return (0, response_1.sendError)(res, "Unauthorized. Admin access required.", 403);
    }
    const enrollmentId = req.params.enrollmentId;
    const adminId = (0, common_1.getUserId)(req);
    const { validityDays } = req.body || {};
    const result = await (0, enrollment_service_1.approveEnrollment)(enrollmentId, adminId, validityDays);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Approval failed", 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, "Enrollment approved successfully");
});
exports.rejectEnrollmentController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userRole = (0, common_1.getUserRole)(req);
    if (userRole !== "admin") {
        return (0, response_1.sendError)(res, "Unauthorized. Admin access required.", 403);
    }
    const enrollmentId = req.params.enrollmentId;
    const adminId = (0, common_1.getUserId)(req);
    const { reason } = req.body;
    const result = await (0, enrollment_service_1.rejectEnrollment)(enrollmentId, adminId, reason);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Rejection failed", 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, "Enrollment rejected");
});
exports.getEnrolledCoursesController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { userId } = req.params;
    if (!userId)
        return (0, response_1.sendError)(res, "User ID is required", 400);
    const requestingUserId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    if (requestingUserId !== userId && userRole !== "admin") {
        return (0, response_1.sendError)(res, "Unauthorized to access these courses", 403);
    }
    const result = await (0, enrollment_service_1.getEnrolledCoursesByUser)(userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Failed to retrieve enrolled courses", 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, { ...result.data, count: result.data?.enrolledCourses?.length || 0 }, "Enrolled courses retrieved successfully");
});
exports.getEnrolledCourseController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId } = req.params;
    if (!courseId)
        return (0, response_1.sendError)(res, "Course ID is required", 400);
    const userId = (0, common_1.getUserId)(req);
    const result = await (0, enrollment_service_1.getEnrolledCourseDetails)(courseId, userId);
    if (!result.success) {
        const statusCode = result.errors?.[0] === "PAYMENT_PENDING" ||
            result.errors?.[0] === "PAYMENT_REJECTED" ||
            result.errors?.[0] === "ENROLLMENT_EXPIRED"
            ? 403
            : 500;
        return (0, response_1.sendError)(res, result.message || "Failed to retrieve enrolled course", statusCode, result.errors);
    }
    return (0, response_1.sendSuccess)(res, { course: result.data }, "Enrolled course retrieved successfully");
});
exports.checkEnrollmentController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { courseId } = req.params;
    if (!courseId)
        return (0, response_1.sendError)(res, "Course ID is required", 400);
    const userId = (0, common_1.getUserId)(req);
    const result = await (0, enrollment_service_1.checkEnrollmentStatus)(courseId, userId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Failed to check enrollment status", 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, "Enrollment status checked successfully");
});
exports.getInstructorDashboardController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { instructorId } = req.params;
    if (!instructorId)
        return (0, response_1.sendError)(res, "Instructor ID is required", 400);
    const requestingUserId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    if (requestingUserId !== instructorId && userRole !== "admin") {
        return (0, response_1.sendError)(res, "Unauthorized to access this dashboard", 403);
    }
    const result = await (0, enrollment_service_1.getInstructorDashboardData)(instructorId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Failed to retrieve dashboard data", 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, "Dashboard data retrieved successfully");
});
exports.getStudentsByInstructorController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { instructorId } = req.params;
    if (!instructorId)
        return (0, response_1.sendError)(res, "Instructor ID is required", 400);
    const requestingUserId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    if (requestingUserId !== instructorId && userRole !== "admin") {
        return (0, response_1.sendError)(res, "Unauthorized to access these students", 403);
    }
    const result = await (0, enrollment_service_1.getStudentsByInstructor)(instructorId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || "Failed to retrieve students", 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, "Students retrieved successfully");
});
exports.submitToolPaymentController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { toolId, transactionId, variationDays } = req.body;
    const studentId = (0, common_1.getUserId)(req);
    if (!toolId)
        return (0, response_1.sendError)(res, "Tool ID is required.", 400);
    if (!transactionId?.trim())
        return (0, response_1.sendError)(res, "Transaction ID is required.", 400);
    const result = await (0, enrollment_service_1.submitToolPayment)({ studentId, toolId, transactionId, variationDays });
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 400, result.errors);
    return (0, response_1.sendSuccess)(res, result.data, result.message || "Payment submitted");
});
exports.checkToolEnrollmentController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { toolId } = req.params;
    if (!toolId)
        return (0, response_1.sendError)(res, "Tool ID is required.", 400);
    const userId = (0, common_1.getUserId)(req);
    const result = await (0, enrollment_service_1.checkToolEnrollmentStatus)(toolId, userId);
    if (!result.success)
        return (0, response_1.sendError)(res, result.message || "Failed", 500, result.errors);
    return (0, response_1.sendSuccess)(res, result.data, "Tool enrollment status checked");
});
exports.getAllEnrollmentsController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    try {
        const userRole = (0, common_1.getUserRole)(req);
        if (userRole !== "admin") {
            return (0, response_1.sendError)(res, "Unauthorized. Admin access required.", 403);
        }
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const enrollments = await enrollment_model_1.default.find()
            .populate("student", "name email")
            .populate("course", "title thumbnail price")
            .populate("tool", "name thumbnail price")
            .sort({ createdAt: -1 })
            .lean();
        const filtered = enrollments.filter((e) => e.student?.email?.toLowerCase().includes(search.toLowerCase()));
        const paginated = filtered.slice(skip, skip + limit);
        return (0, response_1.sendSuccess)(res, {
            enrollments: paginated,
            page,
            pages: Math.ceil(filtered.length / limit),
            total: filtered.length,
        }, "All enrollments retrieved");
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || "Failed to retrieve enrollments", 500);
    }
});
exports.cancelEnrollmentController = (0, catchAsync_1.catchAsync)(async (req, res) => {
    try {
        const userRole = (0, common_1.getUserRole)(req);
        if (userRole !== "admin") {
            return (0, response_1.sendError)(res, "Unauthorized. Admin access required.", 403);
        }
        const enrollmentId = req.params.enrollmentId;
        const enrollment = await enrollment_model_1.default.findById(enrollmentId);
        if (!enrollment) {
            return (0, response_1.sendError)(res, "Enrollment not found", 404);
        }
        enrollment.paymentStatus = "canceled";
        await enrollment.save();
        // ── Package cancel হলে included tools ও cancel ──
        if (enrollment.tool) {
            const purchasedTool = await tool_model_1.default.findById(enrollment.tool).lean();
            if (purchasedTool?.isPackage) {
                await enrollment_model_1.default.updateMany({
                    student: enrollment.student,
                    sourcePackage: enrollment.tool,
                    paymentStatus: { $in: ["paid", "free"] },
                }, { paymentStatus: "canceled" });
            }
        }
        return (0, response_1.sendSuccess)(res, enrollment, "Enrollment canceled successfully");
    }
    catch (error) {
        return (0, response_1.sendError)(res, error.message || "Failed to cancel enrollment", 500);
    }
});
//# sourceMappingURL=enrollment.controller.js.map