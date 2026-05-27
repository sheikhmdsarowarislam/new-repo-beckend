"use strict";
// src/config/rbac.ts (FIXED AND FINALIZED)
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolePermissions = exports.permissions = void 0;
exports.permissions = {
    course: {
        create: "course:create",
        read: "course:read",
        update: "course:update",
        delete: "course:delete",
        analytics: "course:analytics",
        stats: "course:stats",
    },
    user: {
        read: "user:read",
        readAll: "user:readAll", // For reading all users (Admin)
        update: "user:update", // For updating other users (Admin)
        delete: "user:delete", // For deleting other users (Admin)
        updateSelf: "user:updateSelf", // 👈 NEW: For updating own profile
        resetPasswordSelf: "user:resetPasswordSelf", // 👈 NEW: For resetting own password
        updateRole: "user:updateRole", // 👈 For updating user roles (Admin only)
    },
    coupon: {
        create: 'coupon:create',
        read: 'coupon:read',
        update: 'coupon:update',
        delete: 'coupon:delete',
    },
    chapter: {
        create: "chapter:create",
        read: "chapter:read",
        update: "chapter:update",
        delete: "chapter:delete",
    },
    lecture: {
        create: "lecture:create",
        read: "lecture:read",
        update: "lecture:update",
        delete: "lecture:delete",
    },
    quiz: {
        create: "quiz:create",
        read: "quiz:read",
        update: "quiz:update",
        delete: "quiz:delete",
        submit: "quiz:submit",
        readAnswers: "quiz:readAnswers",
        viewResults: "quiz:viewResults"
    },
    progress: {
        read: "progress:read",
        update: "progress:update",
        viewDashboard: "progress:viewDashboard"
    },
    review: {
        create: "review:create",
        read: "review:read",
        update: "review:update",
        delete: "review:delete"
    },
    discussion: {
        create: "discussion:create",
        read: "discussion:read",
        update: "discussion:update",
        delete: "discussion:delete",
        answer: "discussion:answer"
    },
    notification: {
        create: "notification:create",
        read: "notification:read",
        update: "notification:update",
        delete: "notification:delete",
        sendBulk: "notification:sendBulk"
    },
    certificate: {
        read: "certificate:read",
        verify: "certificate:verify",
        stats: "certificate:stats"
    }
};
exports.rolePermissions = {
    // FIX: Corrected typo from 'uesr' to 'user'
    user: [
        exports.permissions.course.read,
        exports.permissions.user.read,
        exports.permissions.user.updateSelf,
        exports.permissions.user.resetPasswordSelf,
        exports.permissions.chapter.read,
        exports.permissions.lecture.read,
        exports.permissions.quiz.read,
        exports.permissions.quiz.submit,
        exports.permissions.quiz.viewResults,
        exports.permissions.progress.read,
        exports.permissions.progress.update,
        exports.permissions.progress.viewDashboard,
        exports.permissions.review.create,
        exports.permissions.review.read,
        exports.permissions.review.update,
        exports.permissions.review.delete,
        exports.permissions.discussion.create,
        exports.permissions.discussion.read,
        exports.permissions.discussion.update,
        exports.permissions.discussion.delete,
        exports.permissions.discussion.answer,
        exports.permissions.notification.read,
        exports.permissions.notification.update,
        exports.permissions.notification.delete,
        exports.permissions.certificate.read,
        exports.permissions.certificate.verify,
    ],
    instructor: [
        exports.permissions.course.create,
        exports.permissions.course.read,
        exports.permissions.course.update,
        exports.permissions.course.delete,
        exports.permissions.course.analytics,
        exports.permissions.course.stats,
        exports.permissions.user.read,
        exports.permissions.user.updateSelf, // 👈 NEW: Can update own profile
        exports.permissions.user.resetPasswordSelf, // 👈 NEW: Can reset own password
        ...Object.values(exports.permissions.chapter),
        ...Object.values(exports.permissions.lecture),
        ...Object.values(exports.permissions.quiz),
        ...Object.values(exports.permissions.progress),
        ...Object.values(exports.permissions.review),
        ...Object.values(exports.permissions.discussion),
        ...Object.values(exports.permissions.notification),
        ...Object.values(exports.permissions.certificate),
    ],
    admin: [
        ...Object.values(exports.permissions.course),
        ...Object.values(exports.permissions.coupon),
        // Admin gets all user permissions, including general update/delete and role updates
        ...Object.values(exports.permissions.user),
        ...Object.values(exports.permissions.chapter),
        ...Object.values(exports.permissions.lecture),
        ...Object.values(exports.permissions.quiz),
        ...Object.values(exports.permissions.progress),
        ...Object.values(exports.permissions.review),
        ...Object.values(exports.permissions.discussion),
        ...Object.values(exports.permissions.notification),
        ...Object.values(exports.permissions.certificate),
    ],
};
//# sourceMappingURL=rbac.js.map