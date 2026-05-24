// src/modules/discussions/discussion.routes.ts

import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createDiscussionHandler,
  answerDiscussionHandler,
  updateDiscussionHandler,
  deleteDiscussionHandler,
  getDiscussionHandler,
  getLectureDiscussionsHandler,
  getCourseDiscussionsHandler,
  getUserDiscussionsHandler,
  getEnrolledCoursesDiscussionsHandler,
} from "./discussion.controller";
import {
  createDiscussionSchema,
  answerDiscussionSchema,
  updateDiscussionSchema,
  discussionIdSchema,
  getLectureDiscussionsSchema,
  getCourseDiscussionsSchema,
  getUserDiscussionsSchema,
} from "./discussion.validation";

const router = Router();

// --- MUTATION ROUTES ---

// POST new discussion
router.post(
  "/", 
  isAuthenticated,
  rbac('discussion:create'),
  validate(createDiscussionSchema), 
  createDiscussionHandler
);

// POST answer to discussion
router.post(
  "/:id/answer", 
  isAuthenticated,
  rbac('discussion:answer'),
  validate(discussionIdSchema),
  validate(answerDiscussionSchema), 
  answerDiscussionHandler
);

// PATCH update discussion 
router.patch(
  "/:id", 
  isAuthenticated,
  rbac('discussion:update'),
  validate(discussionIdSchema),
  validate(updateDiscussionSchema), 
  updateDiscussionHandler
);

// DELETE discussion
router.delete(
  "/:id", 
  isAuthenticated,
  rbac('discussion:delete'),
  validate(discussionIdSchema),
  deleteDiscussionHandler
);

// --- READ ROUTES ---

// IMPORTANT: Specific routes MUST come before wildcard routes like /:id

// GET all discussions for a lecture
router.get(
    "/lecture/:lectureId", 
    isAuthenticated,
    validate(getLectureDiscussionsSchema),
    getLectureDiscussionsHandler
);

// GET all discussions for a course
router.get(
    "/course/:courseId", 
    isAuthenticated,
    validate(getCourseDiscussionsSchema),
    getCourseDiscussionsHandler
);

// GET user's discussions (authenticated user)
router.get(
    "/user/me", 
    isAuthenticated,
    getUserDiscussionsHandler
);

// GET all discussions from user's enrolled courses
router.get(
    "/enrolled", 
    isAuthenticated,
    getEnrolledCoursesDiscussionsHandler
);

// GET single discussion (MUST be last - wildcard route)
router.get(
    "/:id", 
    isAuthenticated,
    validate(discussionIdSchema),
    getDiscussionHandler
);

export default router;
