import { ClientSession } from 'mongoose';
import Chapter, { IChapter } from './chapter.model';
import Lecture from '../lectures/lecture.model';


// --- READ Operations ---

export const findChapterById = (chapterId: string, session?: ClientSession): Promise<IChapter | null> => {
  return Chapter.findById(chapterId)
    .lean<IChapter>()
    .session(session || null)
    .exec();
};

export const findChaptersByCourse = (courseId: string, session?: ClientSession): Promise<IChapter[]> => {
  return Chapter.find({ course: courseId })
    .sort({ order: 1 })
    .lean<IChapter[]>()
    .session(session || null)
    .exec();
};


// --- WRITE Operations ---

export const createChapter = (data: Partial<IChapter>, session?: ClientSession): Promise<IChapter> => {
  return Chapter.create([data], { session: session || undefined, ordered: true }).then(res => {
    if (res.length === 0) {
      throw new Error("Repository failed to create chapter document.");
    }
    return res[0]!;
  });
};

export const updateChapterById = (
  chapterId: string,
  updateData: Partial<IChapter>,
  session?: ClientSession
): Promise<IChapter | null> => {
  return Chapter.findByIdAndUpdate(chapterId, updateData, {
    new: true,
    runValidators: true
  })
    .lean<IChapter>()
    .session(session || null)
    .exec();
};

export const deleteChapterById = (chapterId: string, session?: ClientSession): Promise<IChapter | null> => {
  return Chapter.findByIdAndDelete(chapterId)
    .lean<IChapter>()
    .session(session || null)
    .exec();
};


// --- CASCADING Operations ---

export const deleteChapterDependencies = async (chapterId: string, session: ClientSession): Promise<void> => {
  await Promise.all([
    Lecture.deleteMany({ chapter: chapterId }).session(session).exec()
  ]);
};


// OPTIMIZATION: Get chapter count efficiently
export const getChapterCountByCourse = (courseId: string, session?: ClientSession): Promise<number> => {
  return Chapter.countDocuments({ course: courseId })
    .session(session || null)
    .exec();
};