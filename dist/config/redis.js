"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const _1 = __importDefault(require("."));
const redisClient = () => {
    if (_1.default.redis_url) {
        console.log("Redis connected successfully");
        return _1.default.redis_url;
    }
    throw new Error("Redis connection failed");
};
exports.redis = new ioredis_1.default(redisClient());
//# sourceMappingURL=redis.js.map