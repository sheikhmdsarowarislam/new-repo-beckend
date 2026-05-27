"use strict";
// src/modules/quizes/quiz.controller.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizResultsHandler = exports.submitQuizAttemptHandler = exports.getQuizHandler = exports.deleteQuizHandler = exports.updateQuizHandler = exports.createQuizHandler = void 0;
const quizService = __importStar(require("./quiz.service"));
const catchAsync_1 = require("../../middlewares/catchAsync");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// --- Helper Functions ---
// Enrollment check removed - access control is handled at route/middleware level
// --- CONTROLLER HANDLERS ---
exports.createQuizHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    const result = await quizService.createQuizService(req.body, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Quiz creation failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, result.data, 'Quiz created successfully');
});
exports.updateQuizHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    if (!req.params.id) {
        return (0, response_1.sendError)(res, 'Quiz ID missing', 400);
    }
    const result = await quizService.updateQuizService(req.params.id, req.body, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Quiz update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Quiz updated successfully');
});
exports.deleteQuizHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    if (!req.params.id) {
        return (0, response_1.sendError)(res, 'Quiz ID missing', 400);
    }
    const result = await quizService.deleteQuizService(req.params.id, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Quiz deletion failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, undefined, 'Quiz deleted successfully');
});
exports.getQuizHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const cacheKey = req.cacheKey;
    if (!cacheKey) {
        return (0, response_1.sendError)(res, 'Cache key missing from request', 500);
    }
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    const result = await quizService.getQuizByIdService(req.params.id, cacheKey, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Quiz not found', 404, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Quiz retrieved successfully', 200, { cached: !!cacheKey });
});
exports.submitQuizAttemptHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    if (!req.params.id) {
        return (0, response_1.sendError)(res, 'Quiz ID missing', 400);
    }
    const result = await quizService.submitQuizAttemptService(userId, req.params.id, req.body);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Quiz submission failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Quiz submitted successfully');
});
exports.getQuizResultsHandler = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = (0, common_1.getUserId)(req);
    const cacheKey = req.cacheKey;
    if (!req.params.courseId) {
        return (0, response_1.sendError)(res, 'Course ID missing', 400);
    }
    const result = await quizService.getQuizResultsService(userId, req.params.courseId, cacheKey);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve quiz results', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Quiz results retrieved successfully', 200, { cached: !!cacheKey && result.data.cached });
});
//# sourceMappingURL=quiz.controller.js.map