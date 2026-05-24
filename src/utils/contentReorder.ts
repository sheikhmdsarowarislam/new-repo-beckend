// src/utils/contentReorder.ts

import { Types, Model } from 'mongoose';
import QuizModel, { IQuiz } from '../modules/quizes/quiz.model';
import Lecture, { ILecture } from '../modules/lectures/lecture.model';

// --- 1. Utility for Insertion/Deletion (Shift Down/Up) ---
export async function shiftContentOrder(
  chapterId: Types.ObjectId,
  startOrder: number,
  shiftAmount: number // +1 for insertion, -1 for deletion
): Promise<void> {
  const filter = { chapter: chapterId, order: { $gte: startOrder } };
  const update = { $inc: { order: shiftAmount } };

  // Shifts Lectures
  await Lecture.updateMany(filter, update);

  // Shifts Quizzes
  await QuizModel.updateMany(filter, update);
}

// --- 2. Utility for Order Change (Moving an existing item) ---
export async function resequenceContentOrder(
  chapterId: Types.ObjectId,
  itemId: Types.ObjectId,
  model: Model<ILecture> | Model<IQuiz>, // Accepts either Mongoose Model
  oldOrder: number,
  newOrder: number
): Promise<void> {
    if (oldOrder === newOrder) return; 

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
    await Lecture.updateMany(filter, update);

    // Shift surrounding Quizzes
    await QuizModel.updateMany(filter, update);

    // Finally, update the moved item itself to its new order
    await (model as any).findByIdAndUpdate(itemId, { order: newOrder }).exec();
}