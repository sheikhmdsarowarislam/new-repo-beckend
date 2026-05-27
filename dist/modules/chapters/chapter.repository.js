"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChapterCountByCourse = exports.deleteChapterDependencies = exports.deleteChapterById = exports.updateChapterById = exports.createChapter = exports.findChaptersByCourse = exports.findChapterById = void 0;
const chapter_model_1 = __importDefault(require("./chapter.model"));
const lecture_model_1 = __importDefault(require("../lectures/lecture.model"));
// --- READ Operations ---
const findChapterById = (chapterId, session) => {
    return chapter_model_1.default.findById(chapterId)
        .lean()
        .session(session || null)
        .exec();
};
exports.findChapterById = findChapterById;
const findChaptersByCourse = (courseId, session) => {
    return chapter_model_1.default.find({ course: courseId })
        .sort({ order: 1 })
        .lean()
        .session(session || null)
        .exec();
};
exports.findChaptersByCourse = findChaptersByCourse;
// --- WRITE Operations ---
const createChapter = (data, session) => {
    return chapter_model_1.default.create([data], { session: session || undefined, ordered: true }).then(res => {
        if (res.length === 0) {
            throw new Error("Repository failed to create chapter document.");
        }
        return res[0];
    });
};
exports.createChapter = createChapter;
const updateChapterById = (chapterId, updateData, session) => {
    return chapter_model_1.default.findByIdAndUpdate(chapterId, updateData, {
        new: true,
        runValidators: true
    })
        .lean()
        .session(session || null)
        .exec();
};
exports.updateChapterById = updateChapterById;
const deleteChapterById = (chapterId, session) => {
    return chapter_model_1.default.findByIdAndDelete(chapterId)
        .lean()
        .session(session || null)
        .exec();
};
exports.deleteChapterById = deleteChapterById;
// --- CASCADING Operations ---
const deleteChapterDependencies = async (chapterId, session) => {
    await Promise.all([
        lecture_model_1.default.deleteMany({ chapter: chapterId }).session(session).exec()
    ]);
};
exports.deleteChapterDependencies = deleteChapterDependencies;
// OPTIMIZATION: Get chapter count efficiently
const getChapterCountByCourse = (courseId, session) => {
    return chapter_model_1.default.countDocuments({ course: courseId })
        .session(session || null)
        .exec();
};
exports.getChapterCountByCourse = getChapterCountByCourse;
//# sourceMappingURL=chapter.repository.js.map