"use strict";
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
exports.reorderChapterContentHandler = exports.reorderChaptersHandler = exports.getChapterHandler = exports.getChaptersHandler = exports.deleteChapterHandler = exports.updateChapterHandler = exports.createChapterHandler = void 0;
const chapterService = __importStar(require("./chapter.service"));
const catchAsync_1 = require("../../middlewares/catchAsync");
const common_1 = require("../../utils/common");
const response_1 = require("../../utils/response");
// --- CONTROLLER HANDLERS (CLEANED WITH CATCHASYNC) ---
exports.createChapterHandler = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    const result = await chapterService.createChapter(req.body, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Chapter creation failed', 400, result.errors);
    }
    return (0, response_1.sendCreated)(res, result.data, 'Chapter created successfully');
});
exports.updateChapterHandler = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    const result = await chapterService.updateChapter(req.params.id, req.body, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Chapter update failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Chapter updated successfully');
});
exports.deleteChapterHandler = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    const result = await chapterService.deleteChapterService(req.params.id, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Chapter deletion failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, undefined, 'Chapter and all associated lectures deleted successfully');
});
// Note: Read operations still need explicit checks for cacheKey and 404s.
exports.getChaptersHandler = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const result = await chapterService.getChaptersByCourse(req.params.courseId);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to retrieve chapters', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Chapters retrieved successfully');
});
exports.getChapterHandler = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const result = await chapterService.getChapterById(req.params.id);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Chapter not found', 404, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Chapter retrieved successfully');
});
exports.reorderChaptersHandler = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const userId = (0, common_1.getUserId)(req);
    const userRole = (0, common_1.getUserRole)(req);
    const { courseId, order } = req.body;
    const result = await chapterService.reorderChapters(courseId, order, userId, userRole);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Chapter reordering failed', 400, result.errors);
    }
    return (0, response_1.sendSuccess)(res, undefined, 'Chapters reordered successfully');
});
exports.reorderChapterContentHandler = (0, catchAsync_1.catchAsync)(async (req, res, next) => {
    const chapterId = req.params.chapterId;
    const { items } = req.body;
    if (!chapterId) {
        return (0, response_1.sendError)(res, 'Chapter ID is required', 400);
    }
    const result = await chapterService.reorderChapterContent(chapterId, items);
    if (!result.success) {
        return (0, response_1.sendError)(res, result.message || 'Failed to reorder content', 500, result.errors);
    }
    return (0, response_1.sendSuccess)(res, result.data, 'Chapter content reordered successfully');
});
//# sourceMappingURL=chapter.controller.js.map