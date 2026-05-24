import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errorHandler';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<any>;

// Delegate to centralized asyncHandler for consistent behavior
export const catchAsync = (fn: AsyncFunction) => asyncHandler(fn);