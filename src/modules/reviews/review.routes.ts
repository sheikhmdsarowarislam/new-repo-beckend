// src/modules/reviews/review.routes.ts

import { Router } from "express";
import {
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
  getReviewHandler,
  getCourseReviewsHandler,
  getUserReviewsHandler,
  getCourseReviewStatsHandler,
  getInstructorReviewsHandler,
} from "./review.controller";
import {
  createReviewSchema,
  updateReviewSchema,
  reviewIdSchema,
  getCourseReviewsSchema,
  getUserReviewsSchema,
  getCourseReviewStatsSchema,
  getInstructorReviewsSchema,
} from "./review.validation";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";

const router = Router();

// --- MUTATION ROUTES ---

// POST new review
router.post(
  "/", 
  isAuthenticated,
  rbac('review:create'),
  validate(createReviewSchema), 
  createReviewHandler
);

// PATCH update review 
router.patch(
  "/:id", 
  isAuthenticated,
  rbac('review:update'),
  validate(reviewIdSchema),
  validate(updateReviewSchema), 
  updateReviewHandler
);

// DELETE review
router.delete(
  "/:id", 
  isAuthenticated,
  rbac('review:delete'),
  validate(reviewIdSchema),
  deleteReviewHandler
);

// --- READ ROUTES ---

// GET single review
router.get(
    "/:id", 
    isAuthenticated,
    validate(reviewIdSchema),
    getReviewHandler
);

// GET all reviews for a course (PUBLIC)
router.get(
    "/course/:courseId", 
    validate(getCourseReviewsSchema),
    getCourseReviewsHandler
);

// GET course review statistics
router.get(
    "/stats/course/:courseId", 
    isAuthenticated,
    validate(getCourseReviewStatsSchema),
    getCourseReviewStatsHandler
);

// GET user's reviews (authenticated user)
router.get(
    "/user/me", 
    isAuthenticated,
    validate(getUserReviewsSchema),
    getUserReviewsHandler
);

// GET instructor's reviews (all reviews for instructor's courses)
router.get(
    "/instructor/:instructorId", 
    isAuthenticated,
    validate(getInstructorReviewsSchema),
    getInstructorReviewsHandler
);

export default router;
