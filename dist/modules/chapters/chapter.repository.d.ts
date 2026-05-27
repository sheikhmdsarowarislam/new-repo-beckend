import { ClientSession } from 'mongoose';
import { IChapter } from './chapter.model';
export declare const findChapterById: (chapterId: string, session?: ClientSession) => Promise<IChapter | null>;
export declare const findChaptersByCourse: (courseId: string, session?: ClientSession) => Promise<IChapter[]>;
export declare const createChapter: (data: Partial<IChapter>, session?: ClientSession) => Promise<IChapter>;
export declare const updateChapterById: (chapterId: string, updateData: Partial<IChapter>, session?: ClientSession) => Promise<IChapter | null>;
export declare const deleteChapterById: (chapterId: string, session?: ClientSession) => Promise<IChapter | null>;
export declare const deleteChapterDependencies: (chapterId: string, session: ClientSession) => Promise<void>;
export declare const getChapterCountByCourse: (courseId: string, session?: ClientSession) => Promise<number>;
//# sourceMappingURL=chapter.repository.d.ts.map