// src/modules/chapters/chapter.routes.ts (OPTIMIZED)

import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createChapterHandler,
  getChaptersHandler,
  getChapterHandler,
  reorderChaptersHandler,
  reorderChapterContentHandler,
  updateChapterHandler,
  deleteChapterHandler,
} from "./chapter.controller";
import {
  createChapterSchema,
  updateChapterSchema,
  getChapterSchema, 
  reorderChaptersSchema,
  reorderChapterContentSchema,
  getCourseChaptersSchema,
} from "./chapter.validation";

const router = Router();

// --- MUTATION ROUTES (Concise Stacks) ---

// POST new chapter
router.post(
  "/", 
  isAuthenticated,
    rbac('chapter:create'),
    validate(createChapterSchema), 
  createChapterHandler
);

// PATCH update chapter (Title or Order)
router.patch(
  "/:id", 
  isAuthenticated,
    rbac('chapter:update'),
    validate(updateChapterSchema), 
  updateChapterHandler
);

// DELETE chapter (Transactional cascading delete)
router.delete(
  "/:id", 
  isAuthenticated,
    rbac('chapter:delete'),
    validate(getChapterSchema), // getChapterSchema validates params.id
  deleteChapterHandler 
);

// POST Reorder chapters only (Simplified)
router.post(
  "/reorder", 
  isAuthenticated,
    rbac('chapter:update'),
    validate(reorderChaptersSchema), 
  reorderChaptersHandler
);

// POST Reorder content within a chapter (lectures + quizzes)
router.post(
  "/:chapterId/reorder-content",
  isAuthenticated,
  rbac('chapter:update'),
  validate(reorderChapterContentSchema),
  reorderChapterContentHandler
);

// GET all chapters for a course (List route)
router.get(
    "/course/:courseId", 
    isAuthenticated,
    validate(getCourseChaptersSchema),
    getChaptersHandler
);

// GET single chapter by ID (Remains Correct)
router.get(
    "/:id", 
    isAuthenticated,
    validate(getChapterSchema),
    getChapterHandler
);
export default router;