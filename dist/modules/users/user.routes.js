"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_validation_1 = require("./user.validation");
const user_controller_1 = require("./user.controller");
const auth_1 = require("../../middlewares/auth");
const rbac_1 = require("../../config/rbac");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
// src/modules/users/user.routes.ts (FINAL OPTIMIZED VERSION)
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// --- Unauthenticated Routes (Public Validation) ---
router.post('/register', (0, validate_middleware_1.validate)(user_validation_1.registerUserSchema), user_controller_1.register);
router.post('/activate-user', (0, validate_middleware_1.validate)(user_validation_1.activateUserSchema), user_controller_1.activate);
router.post('/resend-activation', (0, validate_middleware_1.validate)(user_validation_1.resendActivationSchema), user_controller_1.resendActivation);
router.post('/login', (0, validate_middleware_1.validate)(user_validation_1.loginUserSchema), user_controller_1.login);
router.post('/refresh-token', (0, validate_middleware_1.validate)(user_validation_1.refreshTokenSchema), user_controller_1.refresh);
router.post('/social-auth', (0, validate_middleware_1.validate)(user_validation_1.socialAuthSchema), user_controller_1.social);
router.post("/forgot-password", (0, validate_middleware_1.validate)(user_validation_1.forgotPasswordSchema), user_controller_1.forgotPasswordController);
router.post("/reset-password-otp", (0, validate_middleware_1.validate)(user_validation_1.resetPasswordWithOtpSchema), user_controller_1.resetPasswordWithOtpController);
// --- Authenticated Routes (RBAC & Stacks) ---
// Logout user (Authentication handled by router.use, RBAC for policy/check)
router.post('/logout', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.read), user_controller_1.logout);
// Get user info by id
router.get('/me', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.read), user_controller_1.getUser);
router.put('/update-profile', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.updateSelf), (0, validate_middleware_1.validate)(user_validation_1.updateProfileSchema), user_controller_1.updateProfile);
// Reset user password 
router.put('/reset-password', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.resetPasswordSelf), (0, validate_middleware_1.validate)(user_validation_1.resetPasswordSchema), user_controller_1.resetPasswordController);
// Update profile picture
router.put('/update-profile-picture', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.updateSelf), (0, validate_middleware_1.validate)(user_validation_1.updateProfilePictureSchema), user_controller_1.updateProfilePicture);
// --- ADMIN ONLY ROUTES ---
// Get all users (Admin only)
router.get('/all', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.readAll), user_controller_1.getAllUsers);
// Get user statistics (Admin only)
router.get('/stats', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.readAll), user_controller_1.getUserStats);
// Update user role (Admin only)
router.put('/:id/role', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.updateRole), (0, validate_middleware_1.validate)(user_validation_1.updateUserRoleSchema), user_controller_1.updateUserRole);
// Delete user (Admin only)
router.delete('/:id', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.user.delete), user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map