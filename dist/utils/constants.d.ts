export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
};
export declare const CACHE_KEYS: {
    readonly USER: "user";
    readonly COURSE: "course";
    readonly COURSES_LIST: "courses:list";
    readonly ENROLLMENT: "enrollment";
    readonly CHAPTER: "chapter";
    readonly LECTURE: "lecture";
    readonly QUIZ: "quiz";
    readonly PROGRESS: "progress";
    readonly REVIEW: "review";
    readonly DISCUSSION: "discussion";
    readonly NOTIFICATION: "notification";
    readonly CERTIFICATE: "certificate";
};
export declare const CACHE_TTL: {
    readonly SHORT: number;
    readonly MEDIUM: number;
    readonly LONG: number;
    readonly VERY_LONG: number;
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 100;
};
export declare const ROLES: {
    readonly USER: "user";
    readonly INSTRUCTOR: "instructor";
    readonly ADMIN: "admin";
};
export declare const COURSE_STATUS: {
    readonly DRAFT: "draft";
    readonly PUBLISHED: "published";
    readonly ARCHIVED: "archived";
};
export declare const ENROLLMENT_STATUS: {
    readonly PENDING: "pending";
    readonly ACTIVE: "active";
    readonly COMPLETED: "completed";
    readonly CANCELLED: "cancelled";
};
export declare const PAYMENT_STATUS: {
    readonly PENDING: "pending";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly REFUNDED: "refunded";
};
export declare const CONTENT_TYPES: {
    readonly LECTURE: "lecture";
    readonly QUIZ: "quiz";
    readonly ASSIGNMENT: "assignment";
    readonly VIDEO: "video";
    readonly DOCUMENT: "document";
};
export declare const FILE_UPLOAD: {
    readonly MAX_SIZE: number;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
    readonly ALLOWED_VIDEO_TYPES: readonly ["video/mp4", "video/webm", "video/ogg"];
    readonly ALLOWED_DOCUMENT_TYPES: readonly ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
};
export declare const EMAIL_TEMPLATES: {
    readonly ACTIVATION: "activation";
    readonly FORGOT_PASSWORD: "forgot-password";
    readonly COURSE_CREATED: "course-created";
    readonly COURSE_UPDATED: "course-updated";
    readonly COURSE_DELETED: "course-deleted";
    readonly ENROLLMENT: "enrollment";
    readonly CERTIFICATE_COMPLETION: "certificate-completion";
};
export declare const VALIDATION: {
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly NAME_MIN_LENGTH: 2;
    readonly NAME_MAX_LENGTH: 50;
    readonly DESCRIPTION_MAX_LENGTH: 1000;
    readonly TITLE_MAX_LENGTH: 200;
};
//# sourceMappingURL=constants.d.ts.map