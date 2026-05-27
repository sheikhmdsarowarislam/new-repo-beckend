import { ILecture } from './lecture.model';
import { CreateLecturePayload, UpdateLecturePayload, ReorderItem } from './lecture.validation';
export declare function findLectureById(id: string): Promise<ILecture | null>;
export declare function createLectureData(data: CreateLecturePayload): Promise<ILecture>;
export declare function updateLectureData(id: string, update: Partial<UpdateLecturePayload>): Promise<ILecture | null>;
export declare function deleteLectureData(id: string): Promise<ILecture | null>;
/**
 * Performs a bulk update to change the 'order' field for multiple lectures.
 */
export declare function updateLectureOrders(updates: ReorderItem[]): Promise<void>;
//# sourceMappingURL=lecture.repository.d.ts.map