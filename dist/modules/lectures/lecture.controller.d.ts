import { Request, Response, NextFunction } from 'express';
export declare function createLecture(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function updateLecture(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteLecture(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function reorderLectures(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getLectureById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=lecture.controller.d.ts.map