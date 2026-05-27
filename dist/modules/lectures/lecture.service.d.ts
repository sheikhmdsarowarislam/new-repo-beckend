import { ILecture } from './lecture.model';
import { CreateLecturePayload, UpdateLecturePayload, ReorderItem } from './lecture.validation';
type ReorderData = ReorderItem[];
export declare function getLectureLogic(id: string, cacheKey?: string): Promise<ILecture | null>;
export declare function createLectureLogic(data: CreateLecturePayload): Promise<ILecture>;
export declare function updateLectureLogic(id: string, update: Partial<UpdateLecturePayload>): Promise<ILecture | null>;
export declare function deleteLectureLogic(id: string): Promise<ILecture | null>;
export declare function reorderMultipleLecturesLogic(chapterId: string, reorderData: ReorderData): Promise<void>;
export {};
//# sourceMappingURL=lecture.service.d.ts.map