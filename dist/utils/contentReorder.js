"use strict";
// src/utils/contentReorder.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shiftContentOrder = shiftContentOrder;
exports.resequenceContentOrder = resequenceContentOrder;
const quiz_model_1 = __importDefault(require("../modules/quizes/quiz.model"));
const lecture_model_1 = __importDefault(require("../modules/lectures/lecture.model"));
// --- 1. Utility for Insertion/Deletion (Shift Down/Up) ---
async function shiftContentOrder(chapterId, startOrder, shiftAmount // +1 for insertion, -1 for deletion
) {
    const filter = { chapter: chapterId, order: { $gte: startOrder } };
    const update = { $inc: { order: shiftAmount } };
    // Shifts Lectures
    await lecture_model_1.default.updateMany(filter, update);
    // Shifts Quizzes
    await quiz_model_1.default.updateMany(filter, update);
}
// --- 2. Utility for Order Change (Moving an existing item) ---
async function resequenceContentOrder(chapterId, itemId, model, // Accepts either Mongoose Model
oldOrder, newOrder) {
    if (oldOrder === newOrder)
        return;
    // Determine the direction and range to shift
    const isMovingUp = newOrder < oldOrder;
    const updateAmount = isMovingUp ? 1 : -1; // +1 if moving up, -1 if moving down
    // The range of items that need to be shifted to make a hole/close a gap
    const shiftFilter = isMovingUp
        ? { $gte: newOrder, $lt: oldOrder } // e.g., move 5->2, shift 2, 3, 4
        : { $gt: oldOrder, $lte: newOrder }; // e.g., move 2->5, shift 3, 4, 5
    const filter = { chapter: chapterId, order: shiftFilter };
    const update = { $inc: { order: updateAmount } };
    // Shift surrounding Lectures
    await lecture_model_1.default.updateMany(filter, update);
    // Shift surrounding Quizzes
    await quiz_model_1.default.updateMany(filter, update);
    // Finally, update the moved item itself to its new order
    await model.findByIdAndUpdate(itemId, { order: newOrder }).exec();
}
//# sourceMappingURL=contentReorder.js.map