"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rbac = void 0;
const errorHandler_1 = require("../utils/errorHandler");
const rbac_1 = require("../config/rbac");
const rbac = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next((0, errorHandler_1.createError)('User not authenticated', 401));
        }
        const userRole = req.user.role;
        const userPermissions = rbac_1.rolePermissions[userRole];
        if (!userPermissions || !userPermissions.includes(requiredPermission)) {
            return next((0, errorHandler_1.createError)('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.rbac = rbac;
//# sourceMappingURL=rbac.middleware.js.map