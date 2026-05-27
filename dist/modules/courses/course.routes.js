"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const rbac_1 = require("../../config/rbac");
const courseOwnership_middleware_1 = require("../../middlewares/courseOwnership.middleware");
const course_controller_1 = require("./course.controller");
const course_validation_1 = require("./course.validation");
// --- IMPORTS FROM MIDDLEWARE UTILITIES ---
const router = (0, express_1.Router)();
router.get("/", course_controller_1.getAllCoursesController);
// Get recommended courses for user
router.get("/recommended", auth_1.isAuthenticated, course_controller_1.getRecommendedCoursesController);
// Get featured courses
router.get("/featured", course_controller_1.getFeaturedCoursesController);
// Get a single course
router.get("/:id", (0, validate_middleware_1.validate)(course_validation_1.getCourseSchema), course_controller_1.getCourseByIdController);
// Create a new course
router.post("/create", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.course.create), (0, validate_middleware_1.validate)(course_validation_1.createCourseSchema), course_controller_1.createCourseController);
// Update a course (PUT /:id)
router.put("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.course.update), (0, validate_middleware_1.validate)(course_validation_1.getCourseSchema), (0, validate_middleware_1.validate)(course_validation_1.updateCourseSchema), course_controller_1.updateCourseController);
// Delete a course (DELETE /:id)
router.delete("/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.course.delete), (0, validate_middleware_1.validate)(course_validation_1.getCourseSchema), course_controller_1.deleteCourseController);
// Get course analytics (Instructor/Admin only - Course Owner only)
router.get("/analytics/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.course.analytics), (0, validate_middleware_1.validate)(course_validation_1.getCourseSchema), courseOwnership_middleware_1.requireCourseOwnership, course_controller_1.getCourseAnalyticsController);
// Get course statistics (Instructor/Admin only - Course Owner only)
router.get("/stats/:id", auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.course.stats), (0, validate_middleware_1.validate)(course_validation_1.getCourseSchema), courseOwnership_middleware_1.requireCourseOwnership, course_controller_1.getCourseStatsController);
// Get courses by instructor
router.get("/instructor/:instructorId", auth_1.isAuthenticated, (0, validate_middleware_1.validate)(course_validation_1.getInstructorCoursesSchema), course_controller_1.getCoursesByInstructorController);
exports.default = router;
//# sourceMappingURL=course.routes.js.map