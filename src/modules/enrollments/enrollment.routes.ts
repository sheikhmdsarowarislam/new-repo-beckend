
import { Router } from "express"

import { isAuthenticated } from "../../middlewares/auth"

import { validate } from "../../middlewares/validate.middleware"

import {
  submitPaymentSchema,
  getUserEnrolledCoursesSchema,
  getEnrolledCourseDetailsSchema,
  getStudentsByInstructorSchema,
  getInstructorStatsSchema,
  approveRejectSchema,
} from "./enrollment.validation"

import {
  submitPaymentController,
  getPendingEnrollmentsController,
  approveEnrollmentController,
  rejectEnrollmentController,
  getEnrolledCoursesController,
  getEnrolledCourseController,
  checkEnrollmentController,
  getStudentsByInstructorController,
  getInstructorDashboardController,
  getUserToolsController,
  submitToolPaymentController,
  checkToolEnrollmentController,

  // NEW
  getAllEnrollmentsController,
  cancelEnrollmentController,
} from "./enrollment.controller"

const router = Router()



// STUDENT PAYMENT
router.post(
  "/submit-payment",
  isAuthenticated,
  validate(submitPaymentSchema),
  submitPaymentController
)


// TOOL PAYMENT
router.post(
  "/submit-tool-payment",
  isAuthenticated,
  submitToolPaymentController
)


// PENDING
router.get(
  "/pending",
  isAuthenticated,
  getPendingEnrollmentsController
)


// ALL ENROLLMENTS
router.get(
  "/all",
  isAuthenticated,
  getAllEnrollmentsController
)


// CANCEL
router.patch(
  "/:enrollmentId/cancel",
  isAuthenticated,
  cancelEnrollmentController
)


// APPROVE
router.patch(
  "/:enrollmentId/approve",
  isAuthenticated,
  validate(approveRejectSchema),
  approveEnrollmentController
)


// REJECT
router.patch(
  "/:enrollmentId/reject",
  isAuthenticated,
  validate(approveRejectSchema),
  rejectEnrollmentController
)


// ENROLLED COURSES
router.get(
  "/enrolled-courses/:userId",
  isAuthenticated,
  validate(getUserEnrolledCoursesSchema),
  getEnrolledCoursesController
)


// ENROLLED COURSE DETAILS
router.get(
  "/enrolled/:courseId",
  isAuthenticated,
  validate(getEnrolledCourseDetailsSchema),
  getEnrolledCourseController
)


// CHECK COURSE ENROLLMENT
router.get(
  "/check-enrollment/:courseId",
  isAuthenticated,
  validate(getEnrolledCourseDetailsSchema),
  checkEnrollmentController
)


// CHECK TOOL ENROLLMENT
router.get(
  "/check-tool-enrollment/:toolId",
  isAuthenticated,
  checkToolEnrollmentController
)


// INSTRUCTOR DASHBOARD
router.get(
  "/instructor-dashboard/:instructorId",
  isAuthenticated,
  validate(getInstructorStatsSchema),
  getInstructorDashboardController
)


// INSTRUCTOR STUDENTS
router.get(
  "/students/:instructorId",
  isAuthenticated,
  validate(getStudentsByInstructorSchema),
  getStudentsByInstructorController
)


// USER TOOLS
router.get(
  "/my-tools",
  isAuthenticated,
  getUserToolsController
)

export default router