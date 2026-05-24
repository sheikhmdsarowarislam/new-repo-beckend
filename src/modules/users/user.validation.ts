// src/modules/users/user.validation.ts

import { z } from 'zod';

// Base Zod validator for MongoDB ObjectId (conceptual)
const objectIdSchema = z.string().min(1, 'ID is required.'); 

// 1. Register Schema
export const registerUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.enum(['user', 'instructor', 'admin']).optional().default('user'),
  }),
});

// 2. Activate Schema
export const activateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email is required.'),
    activationCode: z.string().min(1, 'Activation code is required.'),
  }),
});

// 2b. Resend Activation Code Schema
export const resendActivationSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required.'),
  }),
});

// 3. Schema for the user login endpoint
export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

// 4. Schema for refreshing the access token
export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().optional(), 
  }),
});

// 5. Schema for social authentication
export const socialAuthSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
    avatar: z.object({
      public_id: z.string().min(1),
      url: z.string().url(),
    }).optional(),
  }),
});

// 6. Schema for updating the user profile
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    bio: z.string().optional(),
  }),
});

// 7. Schema for updating the user password
export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long.'),
  }),
});

// 8. Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

// 9. Reset password with OTP schema
export const resetPasswordWithOtpSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be 6 digits'), 
    newPassword: z.string().min(6, 'New password must be at least 6 characters long.'),
  }),
});

export const updateProfilePictureSchema = z.object({
  body: z.object({
    avatar: z.string().url('Avatar data must be a valid URL/Base64 string.'),
  }),
});

// 10. Schema for updating user role (Admin only)
export const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.enum(['user', 'instructor', 'admin'], {
      message: 'Role must be one of: user, instructor, admin'
    }),
  }),
});