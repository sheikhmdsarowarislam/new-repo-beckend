"use strict";
// Application constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION = exports.EMAIL_TEMPLATES = exports.FILE_UPLOAD = exports.CONTENT_TYPES = exports.PAYMENT_STATUS = exports.ENROLLMENT_STATUS = exports.COURSE_STATUS = exports.ROLES = exports.PAGINATION = exports.CACHE_TTL = exports.CACHE_KEYS = exports.HTTP_STATUS = void 0;
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
};
exports.CACHE_KEYS = {
    USER: 'user',
    COURSE: 'course',
    COURSES_LIST: 'courses:list',
    ENROLLMENT: 'enrollment',
    CHAPTER: 'chapter',
    LECTURE: 'lecture',
    QUIZ: 'quiz',
    PROGRESS: 'progress',
    REVIEW: 'review',
    DISCUSSION: 'discussion',
    NOTIFICATION: 'notification',
    CERTIFICATE: 'certificate',
};
exports.CACHE_TTL = {
    SHORT: 5 * 60, // 5 minutes
    MEDIUM: 15 * 60, // 15 minutes
    LONG: 60 * 60, // 1 hour
    VERY_LONG: 24 * 60 * 60, // 24 hours
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};
exports.ROLES = {
    USER: 'user',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin',
};
exports.COURSE_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived',
};
exports.ENROLLMENT_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};
exports.PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
};
exports.CONTENT_TYPES = {
    LECTURE: 'lecture',
    QUIZ: 'quiz',
    ASSIGNMENT: 'assignment',
    VIDEO: 'video',
    DOCUMENT: 'document',
};
exports.FILE_UPLOAD = {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};
exports.EMAIL_TEMPLATES = {
    ACTIVATION: 'activation',
    FORGOT_PASSWORD: 'forgot-password',
    COURSE_CREATED: 'course-created',
    COURSE_UPDATED: 'course-updated',
    COURSE_DELETED: 'course-deleted',
    ENROLLMENT: 'enrollment',
    CERTIFICATE_COMPLETION: 'certificate-completion',
};
exports.VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 1000,
    TITLE_MAX_LENGTH: 200,
};
//# sourceMappingURL=constants.js.map