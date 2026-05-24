// src/modules/lectures/lecture.repository.ts

import { Types } from 'mongoose';
import Lecture, { ILecture } from './lecture.model';
import { CreateLecturePayload, UpdateLecturePayload, ReorderItem } from './lecture.validation';

// --- Basic CRUD ---

export async function findLectureById(id: string): Promise<ILecture | null> {
  return Lecture.findById(id).exec();
}

export async function createLectureData(data: CreateLecturePayload): Promise<ILecture> {
  return Lecture.create(data);
}

export async function updateLectureData(id: string, update: Partial<UpdateLecturePayload>): Promise<ILecture | null> {
  return Lecture.findByIdAndUpdate(id, update, { new: true }).exec();
}

export async function deleteLectureData(id: string): Promise<ILecture | null> {
  return Lecture.findByIdAndDelete(id).exec();
}

// --- Bulk/Order Management ---

/**
 * Performs a bulk update to change the 'order' field for multiple lectures.
 */
export async function updateLectureOrders(updates: ReorderItem[]): Promise<void> {
  const bulkOps = updates.map(item => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(item.lectureId) },
      update: { $set: { order: item.newOrder } },
    },
  }));
  if (bulkOps.length > 0) {
    await Lecture.bulkWrite(bulkOps);
  }
}