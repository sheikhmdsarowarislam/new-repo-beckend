"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rbac_1 = require("../../config/rbac");
const validate_middleware_1 = require("../../middlewares/validate.middleware");
const auth_1 = require("../../middlewares/auth");
const rbac_middleware_1 = require("../../middlewares/rbac.middleware");
const coupon_validation_1 = require("./coupon.validation");
const coupon_controller_1 = require("./coupon.controller");
const router = (0, express_1.Router)();
// --- Public Routes (No Authentication Required) ---
// Validate coupon for course (used in course purchase flow)
router.post('/validate/:id', (0, validate_middleware_1.validate)(coupon_validation_1.validateCouponSchema), coupon_controller_1.validateCouponController);
// --- Admin Protected Routes ---
// Create a new coupon (Admin only)
router.post('/', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.coupon.create), (0, validate_middleware_1.validate)(coupon_validation_1.createCouponSchema), coupon_controller_1.createCouponController);
// Get all coupons (Admin only)
router.get('/', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.coupon.read), coupon_controller_1.getAllCouponsController);
// Update a coupon (Admin only)
router.put('/:id', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.coupon.update), (0, validate_middleware_1.validate)(coupon_validation_1.updateCouponSchema), coupon_controller_1.updateCouponController);
// Delete a coupon (Admin only)
router.delete('/:id', auth_1.isAuthenticated, (0, rbac_middleware_1.rbac)(rbac_1.permissions.coupon.delete), (0, validate_middleware_1.validate)(coupon_validation_1.deleteCouponSchema), coupon_controller_1.deleteCouponController);
exports.default = router;
//# sourceMappingURL=coupon.routes.js.map