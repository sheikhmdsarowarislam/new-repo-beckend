"use strict";
// src/modules/discussions/discussion.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const discussion_controller_1 = require("./discussion.controller");
const discussion_validation_1 = require("./discussion.validation");
const router = (0, express_1.Router)();
// --- MUTATION ROUTES ---
// POST new discussion
router.post("/", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('discussion:create'), (0, validate_middleware_1.validate)(discussion_validation_1.createDiscussionSchema), discussion_controller_1.createDiscussionHandler);
// POST answer to discussion
router.post("/:id/answer", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('discussion:answer'), (0, validate_middleware_1.validate)(discussion_validation_1.discussionIdSchema), (0, validate_middleware_1.validate)(discussion_validation_1.answerDiscussionSchema), discussion_controller_1.answerDiscussionHandler);
// PATCH update discussion 
router.patch("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('discussion:update'), (0, validate_middleware_1.validate)(discussion_validation_1.discussionIdSchema), (0, validate_middleware_1.validate)(discussion_validation_1.updateDiscussionSchema), discussion_controller_1.updateDiscussionHandler);
// DELETE discussion
router.delete("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)('discussion:delete'), (0, validate_middleware_1.validate)(discussion_validation_1.discussionIdSchema), discussion_controller_1.deleteDiscussionHandler);
// --- READ ROUTES ---
// IMPORTANT: Specific routes MUST come before wildcard routes like /:id
// GET all discussions for a lecture
router.get("/lecture/:lectureId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(discussion_validation_1.getLectureDiscussionsSchema), discussion_controller_1.getLectureDiscussionsHandler);
// GET all discussions for a course
router.get("/course/:courseId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(discussion_validation_1.getCourseDiscussionsSchema), discussion_controller_1.getCourseDiscussionsHandler);
// GET user's discussions (authenticated user)
router.get("/user/me", auth_1.isAuthenticated, discussion_controller_1.getUserDiscussionsHandler);
// GET all discussions from user's enrolled courses
router.get("/enrolled", auth_1.isAuthenticated, discussion_controller_1.getEnrolledCoursesDiscussionsHandler);
// GET single discussion (MUST be last - wildcard route)
router.get("/:id", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(discussion_validation_1.discussionIdSchema), discussion_controller_1.getDiscussionHandler);
exports.default = router;
//# sourceMappingURL=discussion.routes.js.map