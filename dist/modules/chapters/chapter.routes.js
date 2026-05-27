"use strict";
// src/modules/chapters/chapter.routes.ts (OPTIMIZED)
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const chapter_controller_1 = require("./chapter.controller");
const chapter_validation_1 = require("./chapter.validation");
const router = (0, express_1.Router)();
// --- MUTATION ROUTES (Concise Stacks) ---
// POST new chapter
router.post("/", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('chapter:create'), (0, validate_middleware_1.validate)(chapter_validation_1.createChapterSchema), chapter_controller_1.createChapterHandler);
// PATCH update chapter (Title or Order)
router.patch("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('chapter:update'), (0, validate_middleware_1.validate)(chapter_validation_1.updateChapterSchema), chapter_controller_1.updateChapterHandler);
// DELETE chapter (Transactional cascading delete)
router.delete("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('chapter:delete'), (0, validate_middleware_1.validate)(chapter_validation_1.getChapterSchema), // getChapterSchema validates params.id
chapter_controller_1.deleteChapterHandler);
// POST Reorder chapters only (Simplified)
router.post("/reorder", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('chapter:update'), (0, validate_middleware_1.validate)(chapter_validation_1.reorderChaptersSchema), chapter_controller_1.reorderChaptersHandler);
// POST Reorder content within a chapter (lectures + quizzes)
router.post("/:chapterId/reorder-content", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('chapter:update'), (0, validate_middleware_1.validate)(chapter_validation_1.reorderChapterContentSchema), chapter_controller_1.reorderChapterContentHandler);
// GET all chapters for a course (List route)
router.get("/course/:courseId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(chapter_validation_1.getCourseChaptersSchema), chapter_controller_1.getChaptersHandler);
// GET single chapter by ID (Remains Correct)
router.get("/:id", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(chapter_validation_1.getChapterSchema), chapter_controller_1.getChapterHandler);
exports.default = router;
//# sourceMappingURL=chapter.routes.js.map