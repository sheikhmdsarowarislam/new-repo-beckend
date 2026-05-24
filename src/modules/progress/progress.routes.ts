import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
// src/modules/progress/progress.routes.ts

import {
  updateLectureProgressHandler,
  getCourseProgressHandler,
  getUserDashboardHandler,
  getCourseCompletionStatsHandler,
} from "./progress.controller";
import {
  updateLectureProgressSchema,
  getCourseProgressSchema,
  getCourseCompletionStatsSchema,
} from "./progress.validation";

const router = Router();

// --- MUTATION ROUTES ---

// POST update lecture progress
router.post(
  "/lecture/:lectureId", 
  isAuthenticated,
  rbac('progress:update'),
  validate(updateLectureProgressSchema), 
  updateLectureProgressHandler
);

// --- READ ROUTES ---

// GET user dashboard (overview of all courses)
router.get(
    "/dashboard", 
    isAuthenticated,
    getUserDashboardHandler
);

// GET course progress for specific course
router.get(
    "/course/:courseId", 
    isAuthenticated,
    validate(getCourseProgressSchema),
    getCourseProgressHandler
);

// GET course completion statistics (instructor/admin only)
router.get(
    "/stats/course/:courseId", 
    isAuthenticated,
    validate(getCourseCompletionStatsSchema),
    getCourseCompletionStatsHandler
);


export default router;
