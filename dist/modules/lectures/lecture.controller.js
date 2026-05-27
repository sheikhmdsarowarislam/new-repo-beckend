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
exports.createLecture = createLecture;
exports.updateLecture = updateLecture;
exports.deleteLecture = deleteLecture;
exports.reorderLectures = reorderLectures;
exports.getLectureById = getLectureById;
const lectureServices = __importStar(require("./lecture.service"));
// POST /api/lectures (Create)
async function createLecture(req, res, next) {
    try {
        // req.body contains the validated payload directly
        const data = req.body;
        const lecture = await lectureServices.createLectureLogic(data);
        res.status(201).json(lecture);
    }
    catch (error) {
        next(error);
    }
}
// PATCH /api/lectures/:id (Update)
async function updateLecture(req, res, next) {
    try {
        // req.params.id and req.body are guaranteed to be present and validated
        const lectureId = req.params.id;
        const update = req.body;
        const lecture = await lectureServices.updateLectureLogic(lectureId, update);
        if (!lecture)
            return res.status(404).json({ message: 'Lecture not found' });
        res.json(lecture);
    }
    catch (error) {
        next(error);
    }
}
// DELETE /api/lectures/:id
async function deleteLecture(req, res, next) {
    try {
        // req.params.id is guaranteed to be validated
        const lecture = await lectureServices.deleteLectureLogic(req.params.id);
        if (!lecture)
            return res.status(404).json({ message: 'Lecture not found' });
        res.status(200).json({
            success: true,
            message: 'Lecture deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
}
// POST /api/lectures/reorder (Bulk Reordering)
async function reorderLectures(req, res, next) {
    try {
        // req.body is validated as the ReorderLecturesPayload structure
        const { chapterId, reorderData } = req.body;
        await lectureServices.reorderMultipleLecturesLogic(chapterId, reorderData);
        res.status(200).json({ message: 'Lectures reordered successfully' });
    }
    catch (error) {
        next(error);
    }
}
// GET /api/lectures/:id
async function getLectureById(req, res, next) {
    try {
        // req.params.id is guaranteed to be validated
        const lecture = await lectureServices.getLectureLogic(req.params.id);
        if (!lecture)
            return res.status(404).json({ message: 'Lecture not found' });
        res.json(lecture);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=lecture.controller.js.map