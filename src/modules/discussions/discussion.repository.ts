// src/modules/discussions/discussion.repository.ts

import { Types, ClientSession } from 'mongoose';
import Discussion, { IDiscussion } from './discussion.model';


// --- READ Operations ---

export const findDiscussionById = (
  discussionId: string, 
  session?: ClientSession
): Promise<any> => {
  return Discussion.findById(discussionId)
    .populate('user', 'name avatar')
    .populate('lecture', 'title order')
    .populate('answers.user', 'name avatar')
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findDiscussionsByLecture = (
  lectureId: string, 
  options: any = {},
  session?: ClientSession
): Promise<any[]> => {
  const { page = 1, limit = 20, hasAnswers } = options;
  const skip = (page - 1) * limit;
  
  const query: any = { lecture: lectureId };
  if (hasAnswers !== undefined) {
    query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
  }

  return Discussion.find(query)
    .populate('user', 'name avatar')
    .populate('answers.user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findDiscussionsByCourse = (
  courseId: string, 
  options: any = {},
  session?: ClientSession
): Promise<any[]> => {
  const { page = 1, limit = 50, hasAnswers } = options;
  const skip = (page - 1) * limit;
  
  const query: any = { course: courseId };
  if (hasAnswers !== undefined) {
    query['answers.0'] = hasAnswers ? { $exists: true } : { $exists: false };
  }

  return Discussion.find(query)
    .populate('user', 'name avatar')
    .populate('lecture', 'title order')
    .populate('answers.user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};

export const findDiscussionsByUser = (
  userId: string, 
  options: any = {},
  session?: ClientSession
): Promise<any[]> => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  return Discussion.find({ user: userId })
    .populate('lecture', 'title order')
    .populate('course', 'title thumbnail')
    .populate('answers.user', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean() // OPTIMIZATION: Use lean for better performance
    .session(session || null);
};



// --- WRITE Operations ---

export const createDiscussion = (
  data: Partial<IDiscussion>, 
  session?: ClientSession
): Promise<IDiscussion> => {
  return Discussion.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create discussion document.");
    }
    return res[0]!;
  });
};



export const deleteDiscussionById = (
  discussionId: string, 
  session?: ClientSession
): Promise<IDiscussion | null> => {
  return Discussion.findByIdAndDelete(discussionId).session(session || null);
};



// --- AGGREGATION Operations ---

