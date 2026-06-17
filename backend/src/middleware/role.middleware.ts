import { NextFunction, Request, Response } from 'express';
import { Role } from '../types';

/**
 * Factory returning middleware that allows the request only when the
 * authenticated user's role is one of `roles`. Responds 403 otherwise.
 * Must run AFTER `authenticate`.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
}
