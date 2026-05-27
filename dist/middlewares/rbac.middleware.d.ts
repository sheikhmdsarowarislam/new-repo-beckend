import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
export declare const rbac: (requiredPermission: string) => (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.middleware.d.ts.map