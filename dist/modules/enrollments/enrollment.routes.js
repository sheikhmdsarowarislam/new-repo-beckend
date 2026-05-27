"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const enrollment_validation_1 = require("./enrollment.validation");
const enrollment_controller_1 = require("./enrollment.controller");
const router = (0, express_1.Router)();
// STUDENT PAYMENT
router.post("/submit-payment", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.submitPaymentSchema), enrollment_controller_1.submitPaymentController);
// TOOL PAYMENT
router.post("/submit-tool-payment", auth_1.isAuthenticated, enrollment_controller_1.submitToolPaymentController);
// PENDING
router.get("/pending", auth_1.isAuthenticated, enrollment_controller_1.getPendingEnrollmentsController);
// ALL ENROLLMENTS
router.get("/all", auth_1.isAuthenticated, enrollment_controller_1.getAllEnrollmentsController);
// CANCEL
router.patch("/:enrollmentId/cancel", auth_1.isAuthenticated, enrollment_controller_1.cancelEnrollmentController);
// APPROVE
router.patch("/:enrollmentId/approve", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.approveRejectSchema), enrollment_controller_1.approveEnrollmentController);
// REJECT
router.patch("/:enrollmentId/reject", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.approveRejectSchema), enrollment_controller_1.rejectEnrollmentController);
// ENROLLED COURSES
router.get("/enrolled-courses/:userId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.getUserEnrolledCoursesSchema), enrollment_controller_1.getEnrolledCoursesController);
// ENROLLED COURSE DETAILS
router.get("/enrolled/:courseId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.getEnrolledCourseDetailsSchema), enrollment_controller_1.getEnrolledCourseController);
// CHECK COURSE ENROLLMENT
router.get("/check-enrollment/:courseId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.getEnrolledCourseDetailsSchema), enrollment_controller_1.checkEnrollmentController);
// CHECK TOOL ENROLLMENT
router.get("/check-tool-enrollment/:toolId", auth_1.isAuthenticated, enrollment_controller_1.checkToolEnrollmentController);
// INSTRUCTOR DASHBOARD
router.get("/instructor-dashboard/:instructorId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.getInstructorStatsSchema), enrollment_controller_1.getInstructorDashboardController);
// INSTRUCTOR STUDENTS
router.get("/students/:instructorId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(enrollment_validation_1.getStudentsByInstructorSchema), enrollment_controller_1.getStudentsByInstructorController);
// USER TOOLS
router.get("/my-tools", auth_1.isAuthenticated, enrollment_controller_1.getUserToolsController);
exports.default = router;
//# sourceMappingURL=enrollment.routes.js.map