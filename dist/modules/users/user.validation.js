"use strict";
// src/modules/users/user.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleSchema = exports.updateProfilePictureSchema = exports.resetPasswordWithOtpSchema = exports.forgotPasswordSchema = exports.resetPasswordSchema = exports.updateProfileSchema = exports.socialAuthSchema = exports.refreshTokenSchema = exports.loginUserSchema = exports.resendActivationSchema = exports.activateUserSchema = exports.registerUserSchema = void 0;
const zod_1 = require("zod");
// Base Zod validator for MongoDB ObjectId (conceptual)
const objectIdSchema = zod_1.z.string().min(1, 'ID is required.');
// 1. Register Schema
exports.registerUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
        role: zod_1.z.enum(['user', 'instructor', 'admin']).optional().default('user'),
    }),
});
// 2. Activate Schema
exports.activateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Email is required.'),
        activationCode: zod_1.z.string().min(1, 'Activation code is required.'),
    }),
});
// 2b. Resend Activation Code Schema
exports.resendActivationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Valid email is required.'),
    }),
});
// 3. Schema for the user login endpoint
exports.loginUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required.'),
    }),
});
// 4. Schema for refreshing the access token
exports.refreshTokenSchema = zod_1.z.object({
    cookies: zod_1.z.object({
        refreshToken: zod_1.z.string().optional(),
    }),
});
// 5. Schema for social authentication
exports.socialAuthSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        name: zod_1.z.string().min(1, 'Name is required'),
        avatar: zod_1.z.object({
            public_id: zod_1.z.string().min(1),
            url: zod_1.z.string().url(),
        }).optional(),
    }),
});
// 6. Schema for updating the user profile
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required').optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        bio: zod_1.z.string().optional(),
    }),
});
// 7. Schema for updating the user password
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string().min(1, 'Current password is required.'),
        newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters long.'),
    }),
});
// 8. Forgot password schema
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }),
});
// 9. Reset password with OTP schema
exports.resetPasswordWithOtpSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
        newPassword: zod_1.z.string().min(6, 'New password must be at least 6 characters long.'),
    }),
});
exports.updateProfilePictureSchema = zod_1.z.object({
    body: zod_1.z.object({
        avatar: zod_1.z.string().url('Avatar data must be a valid URL/Base64 string.'),
    }),
});
// 10. Schema for updating user role (Admin only)
exports.updateUserRoleSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: objectIdSchema,
    }),
    body: zod_1.z.object({
        role: zod_1.z.enum(['user', 'instructor', 'admin'], {
            message: 'Role must be one of: user, instructor, admin'
        }),
    }),
});
//# sourceMappingURL=user.validation.js.map