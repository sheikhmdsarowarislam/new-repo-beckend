import { ClientSession } from 'mongoose';
import { IDiscussion } from './discussion.model';
export declare const findDiscussionById: (discussionId: string, session?: ClientSession) => Promise<any>;
export declare const findDiscussionsByLecture: (lectureId: string, options?: any, session?: ClientSession) => Promise<any[]>;
export declare const findDiscussionsByCourse: (courseId: string, options?: any, session?: ClientSession) => Promise<any[]>;
export declare const findDiscussionsByUser: (userId: string, options?: any, session?: ClientSession) => Promise<any[]>;
export declare const createDiscussion: (data: Partial<IDiscussion>, session?: ClientSession) => Promise<IDiscussion>;
export declare const deleteDiscussionById: (discussionId: string, session?: ClientSession) => Promise<IDiscussion | null>;
//# sourceMappingURL=discussion.repository.d.ts.map