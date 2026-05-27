"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
// src/modules/progress/progress.routes.ts
const progress_controller_1 = require("./progress.controller");
const progress_validation_1 = require("./progress.validation");
const router = (0, express_1.Router)();
// --- MUTATION ROUTES ---
// POST update lecture progress
router.post("/lecture/:lectureId", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('progress:update'), (0, validate_middleware_1.validate)(progress_validation_1.updateLectureProgressSchema), progress_controller_1.updateLectureProgressHandler);
// --- READ ROUTES ---
// GET user dashboard (overview of all courses)
router.get("/dashboard", auth_1.isAuthenticated, progress_controller_1.getUserDashboardHandler);
// GET course progress for specific course
router.get("/course/:courseId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(progress_validation_1.getCourseProgressSchema), progress_controller_1.getCourseProgressHandler);
// GET course completion statistics (instructor/admin only)
router.get("/stats/course/:courseId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(progress_validation_1.getCourseCompletionStatsSchema), progress_controller_1.getCourseCompletionStatsHandler);
exports.default = router;
//# sourceMappingURL=progress.routes.js.map