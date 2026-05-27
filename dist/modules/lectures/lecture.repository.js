"use strict";
// src/modules/lectures/lecture.repository.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLectureById = findLectureById;
exports.createLectureData = createLectureData;
exports.updateLectureData = updateLectureData;
exports.deleteLectureData = deleteLectureData;
exports.updateLectureOrders = updateLectureOrders;
const mongoose_1 = require("mongoose");
const lecture_model_1 = __importDefault(require("./lecture.model"));
// --- Basic CRUD ---
async function findLectureById(id) {
    return lecture_model_1.default.findById(id).exec();
}
async function createLectureData(data) {
    return lecture_model_1.default.create(data);
}
async function updateLectureData(id, update) {
    return lecture_model_1.default.findByIdAndUpdate(id, update, { new: true }).exec();
}
async function deleteLectureData(id) {
    return lecture_model_1.default.findByIdAndDelete(id).exec();
}
// --- Bulk/Order Management ---
/**
 * Performs a bulk update to change the 'order' field for multiple lectures.
 */
async function updateLectureOrders(updates) {
    const bulkOps = updates.map(item => ({
        updateOne: {
            filter: { _id: new mongoose_1.Types.ObjectId(item.lectureId) },
            update: { $set: { order: item.newOrder } },
        },
    }));
    if (bulkOps.length > 0) {
        await lecture_model_1.default.bulkWrite(bulkOps);
    }
}
//# sourceMappingURL=lecture.repository.js.map