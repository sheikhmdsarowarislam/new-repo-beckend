// Application constants

export const HTTP_STATUS = {
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
} as const;

export const CACHE_KEYS = {
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
} as const;

export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 15 * 60, // 15 minutes
  LONG: 60 * 60, // 1 hour
  VERY_LONG: 24 * 60 * 60, // 24 hours
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const ROLES = {
  USER: 'user',
  INSTRUCTOR: 'instructor',
  ADMIN: 'admin',
} as const;

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const ENROLLMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const CONTENT_TYPES = {
  LECTURE: 'lecture',
  QUIZ: 'quiz',
  ASSIGNMENT: 'assignment',
  VIDEO: 'video',
  DOCUMENT: 'document',
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
} as const;

export const EMAIL_TEMPLATES = {
  ACTIVATION: 'activation',
  FORGOT_PASSWORD: 'forgot-password',
  COURSE_CREATED: 'course-created',
  COURSE_UPDATED: 'course-updated',
  COURSE_DELETED: 'course-deleted',
  ENROLLMENT: 'enrollment',
  CERTIFICATE_COMPLETION: 'certificate-completion',
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 1000,
  TITLE_MAX_LENGTH: 200,
} as const;
