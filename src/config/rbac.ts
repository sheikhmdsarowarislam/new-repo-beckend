// src/config/rbac.ts (FIXED AND FINALIZED)

export const permissions = {
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
    readAll: "user:readAll",    // For reading all users (Admin)
    update: "user:update",      // For updating other users (Admin)
    delete: "user:delete",      // For deleting other users (Admin)
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

export const rolePermissions = {
  // FIX: Corrected typo from 'uesr' to 'user'
  user: [ 
    permissions.course.read,
    permissions.user.read,
    permissions.user.updateSelf, 
    permissions.user.resetPasswordSelf,
    permissions.chapter.read,
    permissions.lecture.read,
    permissions.quiz.read,
    permissions.quiz.submit,
    permissions.quiz.viewResults,
    permissions.progress.read,
    permissions.progress.update,
    permissions.progress.viewDashboard,
    permissions.review.create,
    permissions.review.read,
    permissions.review.update,
    permissions.review.delete,
    permissions.discussion.create,
    permissions.discussion.read,
    permissions.discussion.update,
    permissions.discussion.delete,
    permissions.discussion.answer,
    permissions.notification.read,
    permissions.notification.update,
    permissions.notification.delete,
    permissions.certificate.read,
    permissions.certificate.verify,
  ],
  instructor: [
    permissions.course.create,
    permissions.course.read,
    permissions.course.update,
    permissions.course.delete,
    permissions.course.analytics,
    permissions.course.stats,
    permissions.user.read,
    permissions.user.updateSelf, // 👈 NEW: Can update own profile
    permissions.user.resetPasswordSelf, // 👈 NEW: Can reset own password
    ...Object.values(permissions.chapter),
    ...Object.values(permissions.lecture),
    ...Object.values(permissions.quiz),
    ...Object.values(permissions.progress),
    ...Object.values(permissions.review),
    ...Object.values(permissions.discussion),
    ...Object.values(permissions.notification),
    ...Object.values(permissions.certificate),
  ],
  admin: [
    ...Object.values(permissions.course),
    ...Object.values(permissions.coupon),
    // Admin gets all user permissions, including general update/delete and role updates
    ...Object.values(permissions.user), 
    ...Object.values(permissions.chapter),
    ...Object.values(permissions.lecture),
    ...Object.values(permissions.quiz),
    ...Object.values(permissions.progress),
    ...Object.values(permissions.review),
    ...Object.values(permissions.discussion),
    ...Object.values(permissions.notification),
    ...Object.values(permissions.certificate),
  ],
};