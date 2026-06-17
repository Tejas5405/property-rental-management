import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { UserRepository } from '../repositories/user.repository';
import { HttpError, Role } from '../types';

const ALLOWED_ROLES: Role[] = ['admin', 'manager', 'tenant'];

export const AuthController = {
  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      throw new HttpError(400, 'name, email and password are required');
    }
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'tenant' },
    });
    if (error) throw new HttpError(400, error.message);
    res.status(201).json({ id: data.user?.id, email: data.user?.email });
  },

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body ?? {};
    if (!email || !password) throw new HttpError(400, 'email and password are required');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new HttpError(401, error?.message ?? 'Invalid credentials');
    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: { id: data.user?.id, email: data.user?.email },
    });
  },

  // POST /api/auth/logout
  async logout(_req: Request, res: Response): Promise<void> {
    res.json({ success: true });
  },

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body ?? {};
    if (!email) throw new HttpError(400, 'email is required');
    const redirectTo = `${process.env.FRONTEND_URL ?? ''}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new HttpError(400, error.message);
    res.json({ success: true });
  },

  // GET /api/auth/me
  async me(req: Request, res: Response): Promise<void> {
    res.json(req.user);
  },

  // PUT /api/auth/users/:id/role  (admin only)
  async updateRole(req: Request, res: Response): Promise<void> {
    const { role } = req.body ?? {};
    if (!ALLOWED_ROLES.includes(role)) throw new HttpError(400, 'Invalid role');
    const target = await UserRepository.findById(req.params.id);
    if (!target) throw new HttpError(404, 'User not found');
    const updated = await UserRepository.updateRole(req.params.id, role);
    res.json(updated);
  },
};
