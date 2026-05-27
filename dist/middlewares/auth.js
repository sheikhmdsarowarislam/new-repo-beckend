"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("../utils/errorHandler");
const config_1 = __importDefault(require("../config"));
const user_service_1 = require("../modules/users/user.service");
const isAuthenticated = async (req, res, next) => {
    let token = undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    if (!token) {
        token = req.cookies.accessToken;
    }
    if (!token) {
        return next((0, errorHandler_1.createError)("Unauthorized Access: Access Token is missing.", 401));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_access_secret);
        const result = await (0, user_service_1.getUserById)(decoded.id);
        if (!result.success || !result.data)
            return next((0, errorHandler_1.createError)("User not found", 404));
        req.user = result.data;
        next();
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next((0, errorHandler_1.createError)("Access token has expired. Please refresh your session.", 401));
        }
        else if (error.name === 'JsonWebTokenError') {
            return next((0, errorHandler_1.createError)("Invalid access token. Please login again.", 401));
        }
        return next((0, errorHandler_1.createError)("Token verification failed", 401));
    }
};
exports.isAuthenticated = isAuthenticated;
//# sourceMappingURL=auth.js.map