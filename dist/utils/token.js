"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
// Function to generate an access token
const generateAccessToken = (payload) => {
    if (!JWT_ACCESS_SECRET) {
        throw new Error("JWT_ACCESS_SECRET is not defined");
    }
    return jsonwebtoken_1.default.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
};
exports.generateAccessToken = generateAccessToken;
// Function to generate a refresh token
const generateRefreshToken = (payload) => {
    if (!JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not defined");
    }
    return jsonwebtoken_1.default.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
};
exports.generateRefreshToken = generateRefreshToken;
// Function to verify an access token
const verifyAccessToken = (token) => {
    if (!JWT_ACCESS_SECRET) {
        throw new Error("JWT_ACCESS_SECRET is not defined");
    }
    // The 'as any' casting is no longer needed
    const decoded = jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
    return decoded;
};
exports.verifyAccessToken = verifyAccessToken;
// Function to verify a refresh token
const verifyRefreshToken = (token) => {
    if (!JWT_REFRESH_SECRET) {
        throw new Error("JWT_REFRESH_SECRET is not defined");
    }
    const decoded = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
    return decoded;
};
exports.verifyRefreshToken = verifyRefreshToken;
//# sourceMappingURL=token.js.map