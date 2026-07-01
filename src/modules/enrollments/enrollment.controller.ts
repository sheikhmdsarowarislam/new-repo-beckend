import { Request, Response } from "express";
import { catchAsync } from "../../middlewares/catchAsync";
import { AuthRequest } from "../../middlewares/auth";
import Enrollment from "./enrollment.model";
import Tool from "../tools/tool.model";
import {
   adminManualEnrollTool, 
  submitManualPayment,
  approveEnrollment,
  rejectEnrollment,
  getPendingEnrollments,
  getEnrolledCoursesByUser,
  getEnrolledCourseDetails,
  checkEnrollmentStatus,
  getStudentsByInstructor,
  getInstructorDashboardData,
  getUserTools,
  submitToolPayment,
  checkToolEnrollmentStatus,
} from "./enrollment.service";
import { getUserId, getUserRole } from "../../utils/common";
import { sendSuccess, sendError } from "../../utils/response";

export const getUserToolsController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const result = await getUserTools(userId);
  if (!result.success) return sendError(res, result.message || "Failed", 500, result.errors);
  return sendSuccess(res, result.data, "User tools retrieved");
});

export const submitPaymentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId, transactionId, couponCode } = req.body;
  const studentId = getUserId(req);

  if (!transactionId || !transactionId.trim()) {
    return sendError(res, "Transaction ID or mobile number is required.", 400);
  }

  const result = await submitManualPayment({ studentId, courseId, transactionId, couponCode });
  if (!result.success) {
    return sendError(res, result.message || "Payment submission failed", 400, result.errors);
  }
  return sendSuccess(res, result.data, result.message || "Payment submitted successfully");
});

export const getPendingEnrollmentsController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userRole = getUserRole(req);
  if (userRole !== "admin") {
    return sendError(res, "Unauthorized. Admin access required.", 403);
  }
  const result = await getPendingEnrollments();
  if (!result.success) {
    return sendError(res, result.message || "Failed to retrieve pending enrollments", 500, result.errors);
  }
  return sendSuccess(res, result.data, "Pending enrollments retrieved successfully");
});

export const approveEnrollmentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userRole = getUserRole(req);
  if (userRole !== "admin") {
    return sendError(res, "Unauthorized. Admin access required.", 403);
  }
  const enrollmentId = req.params.enrollmentId as string;
  const adminId = getUserId(req);
  const { validityDays } = req.body || {};

  const result = await approveEnrollment(enrollmentId, adminId, validityDays);
  if (!result.success) {
    return sendError(res, result.message || "Approval failed", 400, result.errors);
  }
  return sendSuccess(res, result.data, "Enrollment approved successfully");
});

export const rejectEnrollmentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const userRole = getUserRole(req);
  if (userRole !== "admin") {
    return sendError(res, "Unauthorized. Admin access required.", 403);
  }
  const enrollmentId = req.params.enrollmentId as string;
  const adminId = getUserId(req);
  const { reason } = req.body;

  const result = await rejectEnrollment(enrollmentId, adminId, reason);
  if (!result.success) {
    return sendError(res, result.message || "Rejection failed", 400, result.errors);
  }
  return sendSuccess(res, result.data, "Enrollment rejected");
});

export const getEnrolledCoursesController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  if (!userId) return sendError(res, "User ID is required", 400);

  const requestingUserId = getUserId(req);
  const userRole = getUserRole(req);
  if (requestingUserId !== userId && userRole !== "admin") {
    return sendError(res, "Unauthorized to access these courses", 403);
  }

  const result = await getEnrolledCoursesByUser(userId);
  if (!result.success) {
    return sendError(res, result.message || "Failed to retrieve enrolled courses", 500, result.errors);
  }
  return sendSuccess(
    res,
    { ...result.data, count: result.data?.enrolledCourses?.length || 0 },
    "Enrolled courses retrieved successfully"
  );
});

export const getEnrolledCourseController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  if (!courseId) return sendError(res, "Course ID is required", 400);

  const userId = getUserId(req);
  const result = await getEnrolledCourseDetails(courseId, userId);

  if (!result.success) {
    const statusCode =
      result.errors?.[0] === "PAYMENT_PENDING" ||
      result.errors?.[0] === "PAYMENT_REJECTED" ||
      result.errors?.[0] === "ENROLLMENT_EXPIRED"
        ? 403
        : 500;
    return sendError(res, result.message || "Failed to retrieve enrolled course", statusCode, result.errors);
  }
  return sendSuccess(res, { course: result.data }, "Enrolled course retrieved successfully");
});

export const checkEnrollmentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { courseId } = req.params;
  if (!courseId) return sendError(res, "Course ID is required", 400);

  const userId = getUserId(req);
  const result = await checkEnrollmentStatus(courseId, userId);

  if (!result.success) {
    return sendError(res, result.message || "Failed to check enrollment status", 500, result.errors);
  }
  return sendSuccess(res, result.data, "Enrollment status checked successfully");
});

export const getInstructorDashboardController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { instructorId } = req.params;
  if (!instructorId) return sendError(res, "Instructor ID is required", 400);

  const requestingUserId = getUserId(req);
  const userRole = getUserRole(req);
  if (requestingUserId !== instructorId && userRole !== "admin") {
    return sendError(res, "Unauthorized to access this dashboard", 403);
  }

  const result = await getInstructorDashboardData(instructorId);
  if (!result.success) {
    return sendError(res, result.message || "Failed to retrieve dashboard data", 500, result.errors);
  }
  return sendSuccess(res, result.data, "Dashboard data retrieved successfully");
});

export const getStudentsByInstructorController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { instructorId } = req.params;
  if (!instructorId) return sendError(res, "Instructor ID is required", 400);

  const requestingUserId = getUserId(req);
  const userRole = getUserRole(req);
  if (requestingUserId !== instructorId && userRole !== "admin") {
    return sendError(res, "Unauthorized to access these students", 403);
  }

  const result = await getStudentsByInstructor(instructorId);
  if (!result.success) {
    return sendError(res, result.message || "Failed to retrieve students", 500, result.errors);
  }
  return sendSuccess(res, result.data, "Students retrieved successfully");
});

export const submitToolPaymentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { toolId, transactionId, variationDays } = req.body;
  const studentId = getUserId(req);
  if (!toolId) return sendError(res, "Tool ID is required.", 400);
  if (!transactionId?.trim()) return sendError(res, "Transaction ID is required.", 400);
  const result = await submitToolPayment({ studentId, toolId, transactionId, variationDays });
  if (!result.success) return sendError(res, result.message || "Failed", 400, result.errors);
  return sendSuccess(res, result.data, result.message || "Payment submitted");
});

export const checkToolEnrollmentController = catchAsync(async (req: AuthRequest, res: Response) => {
  const { toolId } = req.params;
  if (!toolId) return sendError(res, "Tool ID is required.", 400);
  const userId = getUserId(req);
  const result = await checkToolEnrollmentStatus(toolId, userId);
  if (!result.success) return sendError(res, result.message || "Failed", 500, result.errors);
  return sendSuccess(res, result.data, "Tool enrollment status checked");
});

export const getAllEnrollmentsController = catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    const userRole = getUserRole(req);
    if (userRole !== "admin") {
      return sendError(res, "Unauthorized. Admin access required.", 403);
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || "";

    const enrollments = await Enrollment.find()
      .populate("student", "name email")
      .populate("course", "title thumbnail price")
      .populate("tool", "name thumbnail price")
      .sort({ createdAt: -1 })
      .lean();

    const filtered = enrollments.filter((e: any) =>
      e.student?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const paginated = filtered.slice(skip, skip + limit);

    return sendSuccess(
      res,
      {
        enrollments: paginated,
        page,
        pages: Math.ceil(filtered.length / limit),
        total: filtered.length,
      },
      "All enrollments retrieved"
    );
  } catch (error: any) {
    return sendError(res, error.message || "Failed to retrieve enrollments", 500);
  }
});

export const cancelEnrollmentController = catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    const userRole = getUserRole(req);
    if (userRole !== "admin") {
      return sendError(res, "Unauthorized. Admin access required.", 403);
    }

    const enrollmentId = req.params.enrollmentId;
    const enrollment = await Enrollment.findById(enrollmentId);

    if (!enrollment) {
      return sendError(res, "Enrollment not found", 404);
    }

    enrollment.paymentStatus = "canceled";
    await enrollment.save();

    // ── Package cancel হলে included tools ও cancel ──
    if (enrollment.tool) {
      const purchasedTool = await Tool.findById(enrollment.tool).lean();
      if (purchasedTool?.isPackage) {
        await Enrollment.updateMany(
          {
            student: enrollment.student,
            sourcePackage: enrollment.tool,
            paymentStatus: { $in: ["paid", "free"] },
          },
          { paymentStatus: "canceled" }
        );
      }
    }

    return sendSuccess(res, enrollment, "Enrollment canceled successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed to cancel enrollment", 500);
  }
});

export const adminManualEnrollController = catchAsync(async (req: AuthRequest, res: Response) => {
  try {
    const userRole = getUserRole(req);
    if (userRole !== "admin") {
      return sendError(res, "Unauthorized. Admin access required.", 403);
    }

    const { userId, toolId, variationDays } = req.body;

    if (!userId) return sendError(res, "User ID is required.", 400);
    if (!toolId) return sendError(res, "Tool ID is required.", 400);

    const adminId = getUserId(req);

    const result = await adminManualEnrollTool({
      adminId,
      userId,
      toolId,
      variationDays: variationDays ? Number(variationDays) : undefined,
    });

    if (!result.success) return sendError(res, result.message || "Failed", 400, result.errors);
    return sendSuccess(res, result.data, result.message || "Enrolled successfully");
  } catch (error: any) {
    return sendError(res, error.message || "Failed", 500);
  }
});