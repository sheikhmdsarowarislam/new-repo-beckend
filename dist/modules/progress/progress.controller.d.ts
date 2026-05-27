import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth";
interface ProgressAuthRequest extends AuthRequest {
    params: {
        courseId?: string;
        lectureId?: string;
    };
    body: any;
}
export declare const updateLectureProgressHandler: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getCourseProgressHandler: (req: ProgressAuthRequest, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserDashboardHandler: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export declare const getCourseCompletionStatsHandler: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
export {};
//# sourceMappingURL=progress.controller.d.ts.map