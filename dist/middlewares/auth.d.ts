import { NextFunction, Request, Response } from "express";
import { IUser } from "../modules/users/user.model";
export interface AuthRequest extends Request {
    user?: IUser;
}
export declare const isAuthenticated: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map