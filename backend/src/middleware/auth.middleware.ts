import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/supabase';
import { UserRepository } from '../repositories/user.repository';

/**
 * Authenticates a request using the `Authorization: Bearer <jwt>` header.
 * On success, attaches the full public.users row to `req.user`.
 * Responds 401 when the token is missing, invalid, or has no matching user.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const authUser = await verifyToken(token);
  if (!authUser) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const user = await UserRepository.findById(authUser.id);
  if (!user) {
    res.status(401).json({ error: 'Authenticated user not found' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: 'Account is deactivated' });
    return;
  }

  req.user = user;
  next();
}
