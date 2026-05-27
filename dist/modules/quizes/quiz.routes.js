"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
// src/modules/quizes/quiz.routes.ts
const quiz_controller_1 = require("./quiz.controller");
const quiz_validation_1 = require("./quiz.validation");
const router = (0, express_1.Router)();
// --- MUTATION ROUTES ---
// POST new quiz
router.post("/", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("quiz:create"), (0, validate_middleware_1.validate)(quiz_validation_1.createQuizSchema), quiz_controller_1.createQuizHandler);
// PATCH update quiz
router.patch("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("quiz:update"), (0, validate_middleware_1.validate)(quiz_validation_1.quizIdSchema), (0, validate_middleware_1.validate)(quiz_validation_1.updateQuizSchema), quiz_controller_1.updateQuizHandler);
// DELETE quiz
router.delete("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("quiz:delete"), (0, validate_middleware_1.validate)(quiz_validation_1.quizIdSchema), quiz_controller_1.deleteQuizHandler);
// POST submit quiz attempt
router.post("/:id/submit", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("quiz:submit"), (0, validate_middleware_1.validate)(quiz_validation_1.quizIdSchema), (0, validate_middleware_1.validate)(quiz_validation_1.submitQuizAttemptSchema), quiz_controller_1.submitQuizAttemptHandler);
// --- READ ROUTES ---
// GET single quiz
router.get("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)("quiz:read"), (0, validate_middleware_1.validate)(quiz_validation_1.quizIdSchema), quiz_controller_1.getQuizHandler);
// GET quiz results for a course
router.get("/results/course/:courseId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(quiz_validation_1.getQuizResultsSchema), quiz_controller_1.getQuizResultsHandler);
exports.default = router;
//# sourceMappingURL=quiz.routes.js.map