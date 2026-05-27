"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCourseOwnership = void 0;
const course_model_1 = __importDefault(require("../modules/courses/course.model"));
const common_1 = require("../utils/common");
const catchAsync_1 = require("./catchAsync");
const errorHandler_1 = require("../utils/errorHandler");
exports.requireCourseOwnership = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const courseId = req.params.id;
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    if (!courseId) {
        throw (0, errorHandler_1.createError)('Course ID is required', 400);
    }
    // Inline ownership validation
    if (userRole === 'admin') {
        next();
        return;
    }
    const course = await course_model_1.default.findById(courseId).lean();
    if (!course) {
        throw (0, errorHandler_1.createError)('Course not found', 404);
    }
    if (userRole === 'instructor' && course.instructor.toString() !== userId) {
        throw (0, errorHandler_1.createError)('You do not have permission to modify this course', 403);
    }
    next();
});
//# sourceMappingURL=courseOwnership.middleware.js.map