import { Request, Response, NextFunction } from 'express';
import * as lectureServices from './lecture.service';
import { CreateLecturePayload, UpdateLecturePayload, ReorderLecturesPayload } from './lecture.validation'; 

// POST /api/lectures (Create)
export async function createLecture(req: Request, res: Response, next: NextFunction) {
  try {
    // req.body contains the validated payload directly
    const data = req.body as CreateLecturePayload;
    const lecture = await lectureServices.createLectureLogic(data);
    res.status(201).json(lecture);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/lectures/:id (Update)
export async function updateLecture(req: Request, res: Response, next: NextFunction) {
  try {
    // req.params.id and req.body are guaranteed to be present and validated
    const lectureId = req.params.id;
    const update = req.body as UpdateLecturePayload;
    
    const lecture = await lectureServices.updateLectureLogic(lectureId as string, update);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json(lecture);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/lectures/:id
export async function deleteLecture(req: Request, res: Response, next: NextFunction) {
  try {
    // req.params.id is guaranteed to be validated
    const lecture = await lectureServices.deleteLectureLogic(req.params.id as string);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

// POST /api/lectures/reorder (Bulk Reordering)
export async function reorderLectures(req: Request, res: Response, next: NextFunction) {
  try {
    // req.body is validated as the ReorderLecturesPayload structure
    const { chapterId, reorderData } = req.body as ReorderLecturesPayload;
    await lectureServices.reorderMultipleLecturesLogic(chapterId, reorderData);
    res.status(200).json({ message: 'Lectures reordered successfully' });
  } catch (error) {
    next(error);
  }
}

// GET /api/lectures/:id
export async function getLectureById(req: Request, res: Response, next: NextFunction) {
  try {
    // req.params.id is guaranteed to be validated
    const lecture = await lectureServices.getLectureLogic(req.params.id as string);
    if (!lecture) return res.status(404).json({ message: 'Lecture not found' });
    res.json(lecture);
  } catch (error) {
    next(error);
  }
}
