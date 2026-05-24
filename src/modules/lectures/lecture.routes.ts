// src/modules/lectures/lecture.routes.ts

import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { rbac } from "../../middlewares/rbac.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  CreateLectureSchema,
  ReorderLecturesSchema,
  UpdateLectureSchema,
} from "./lecture.validation";
import {
  createLecture,
  deleteLecture,
  reorderLectures,
  updateLecture,
} from "./lecture.controller";

const router = Router();

// --- MUTATION ROUTES ---

// POST new lecture
router.post(
  "/",
  isAuthenticated,
  rbac("lecture:create"),
  validate(CreateLectureSchema),
  createLecture
);

// PATCH update lecture
router.patch(
  "/:id",
  isAuthenticated,
  rbac("lecture:update"),
  validate(UpdateLectureSchema),
  updateLecture
);

// DELETE lecture
router.delete("/:id", isAuthenticated, rbac("lecture:delete"), deleteLecture);

// POST /api/lectures/reorder (Bulk Reordering)
router.post(
  "/reorder",
  isAuthenticated,
  rbac("lecture:update"),
  validate(ReorderLecturesSchema),
  reorderLectures
);

export default router;
