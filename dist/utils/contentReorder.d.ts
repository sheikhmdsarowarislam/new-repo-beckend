import { Types, Model } from 'mongoose';
import { IQuiz } from '../modules/quizes/quiz.model';
import { ILecture } from '../modules/lectures/lecture.model';
export declare function shiftContentOrder(chapterId: Types.ObjectId, startOrder: number, shiftAmount: number): Promise<void>;
export declare function resequenceContentOrder(chapterId: Types.ObjectId, itemId: Types.ObjectId, model: Model<ILecture> | Model<IQuiz>, // Accepts either Mongoose Model
oldOrder: number, newOrder: number): Promise<void>;
//# sourceMappingURL=contentReorder.d.ts.map