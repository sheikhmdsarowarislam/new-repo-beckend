import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../modules/users/user.model";
import { createError } from "../utils/errorHandler";
import config from "../config";
import { getUserById } from "../modules/users/user.service";


export interface AuthRequest extends Request {
    user?: IUser;
}

export const isAuthenticated = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined = undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    if (!token) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        return next(createError("Unauthorized Access: Access Token is missing.", 401));
    }

    try {
        const decoded = jwt.verify(token, config.jwt_access_secret!) as { id: string };
        const result = await getUserById(decoded.id); 

        if (!result.success || !result.data) return next(createError("User not found", 404));

        req.user = result.data;
        next();

    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return next(createError("Access token has expired. Please refresh your session.", 401));
        } else if (error.name === 'JsonWebTokenError') {
            return next(createError("Invalid access token. Please login again.", 401));
        }
        return next(createError("Token verification failed", 401));
    }
};