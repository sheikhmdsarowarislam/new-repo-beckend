"use strict";
// src/modules/lectures/lecture.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const lecture_validation_1 = require("./lecture.validation");
const lecture_controller_1 = require("./lecture.controller");
const router = (0, express_1.Router)();
// --- MUTATION ROUTES ---
// POST new lecture
router.post("/", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("lecture:create"), (0, validate_middleware_1.validate)(lecture_validation_1.CreateLectureSchema), lecture_controller_1.createLecture);
// PATCH update lecture
router.patch("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("lecture:update"), (0, validate_middleware_1.validate)(lecture_validation_1.UpdateLectureSchema), lecture_controller_1.updateLecture);
// DELETE lecture
router.delete("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("lecture:delete"), lecture_controller_1.deleteLecture);
// POST /api/lectures/reorder (Bulk Reordering)
router.post("/reorder", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("lecture:update"), (0, validate_middleware_1.validate)(lecture_validation_1.ReorderLecturesSchema), lecture_controller_1.reorderLectures);
exports.default = router;
//# sourceMappingURL=lecture.routes.js.map