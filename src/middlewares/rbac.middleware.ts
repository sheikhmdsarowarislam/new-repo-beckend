// src/middlewares/rbac.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorHandler';
import { createError } from '../utils/errorHandler';
import { rolePermissions } from '../config/rbac';
import { AuthRequest } from './auth';

export const rbac = (requiredPermission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {

    if (!req.user) {
      return next(createError('User not authenticated', 401));
    }
    
    const userRole = req.user.role;
    const userPermissions = rolePermissions[userRole as keyof typeof rolePermissions];
    
    if (!userPermissions || !userPermissions.includes(requiredPermission)) {
      return next(createError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
};