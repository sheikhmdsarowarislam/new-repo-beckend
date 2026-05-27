"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Environment validation
const requiredEnvVars = [
    'MONGODB_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Please set these variables in your .env file');
    process.exit(1);
}
const config = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    database_url: process.env.MONGODB_URL,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "your-cloud-name",
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY || "your-api-key",
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || "your-api-secret",
    redis_url: process.env.REDIS_URL || "",
};
exports.default = config;
//# sourceMappingURL=index.js.map