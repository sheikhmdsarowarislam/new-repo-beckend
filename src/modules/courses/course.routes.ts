import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { permissions } from "../../config/rbac";
import { requireCourseOwnership } from "../../middlewares/courseOwnership.middleware";
import {
  createCourseController,
  updateCourseController,
  deleteCourseController,
  getAllCoursesController,
  getCourseByIdController,
  getRecommendedCoursesController,
  getFeaturedCoursesController,
  getCourseAnalyticsController,
  getCourseStatsController,
  getCoursesByInstructorController,
} from "./course.controller";
import {
  createCourseSchema,
  updateCourseSchema,
  getCourseSchema,
  getInstructorCoursesSchema,
} from "./course.validation";

// --- IMPORTS FROM MIDDLEWARE UTILITIES ---

const router = Router();

router.get(
  "/",
  getAllCoursesController
);

// Get recommended courses for user
router.get(
  "/recommended",
  isAuthenticated,
  getRecommendedCoursesController
);

// Get featured courses
router.get(
  "/featured",
  getFeaturedCoursesController
);

// Get a single course
router.get(
  "/:id",
  validate(getCourseSchema),
  getCourseByIdController
);

// Create a new course
router.post(
  "/create",
  isAuthenticated,
  rbac(permissions.course.create),
  validate(createCourseSchema),
  createCourseController
);

// Update a course (PUT /:id)
router.put(
  "/:id",
  isAuthenticated,
  rbac(permissions.course.update),
  validate(getCourseSchema),
  validate(updateCourseSchema),
  updateCourseController
);

// Delete a course (DELETE /:id)
router.delete(
  "/:id",
  isAuthenticated,
  rbac(permissions.course.delete),
  validate(getCourseSchema),
  deleteCourseController
);

// Get course analytics (Instructor/Admin only - Course Owner only)
router.get(
  "/analytics/:id",
  isAuthenticated,
  rbac(permissions.course.analytics),
  validate(getCourseSchema),
  requireCourseOwnership,
  getCourseAnalyticsController
);

// Get course statistics (Instructor/Admin only - Course Owner only)
router.get(
  "/stats/:id",
  isAuthenticated,
  rbac(permissions.course.stats),
  validate(getCourseSchema),
  requireCourseOwnership,
  getCourseStatsController
);

// Get courses by instructor
router.get(
  "/instructor/:instructorId",
  isAuthenticated,
  validate(getInstructorCoursesSchema),
  getCoursesByInstructorController
);

export default router;
