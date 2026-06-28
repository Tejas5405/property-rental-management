import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { UserRepository } from '../repositories/user.repository';
import { HttpError } from '../types';

export const AuthController = {
  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;
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
    const { email, password } = req.body;
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
    const { email } = req.body;
    const redirectTo = `${process.env.FRONTEND_URL ?? ''}/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new HttpError(400, error.message);
    res.json({ success: true });
  },

  // GET /api/auth/me
  async me(req: Request, res: Response): Promise<void> {
    res.json(req.user);
  },

  // GET /api/auth/users  (admin only)
  async listUsers(_req: Request, res: Response): Promise<void> {
    res.json(await UserRepository.findAll());
  },

  // PUT /api/auth/users/:id/active  (admin only)
  async setActive(req: Request, res: Response): Promise<void> {
    const { is_active } = req.body;
    const target = await UserRepository.findById(req.params.id);
    if (!target) throw new HttpError(404, 'User not found');
    res.json(await UserRepository.update(req.params.id, { is_active }));
  },

  // PUT /api/auth/users/:id/role  (admin only)
  async updateRole(req: Request, res: Response): Promise<void> {
    const { role } = req.body;
    const target = await UserRepository.findById(req.params.id);
    if (!target) throw new HttpError(404, 'User not found');
    const updated = await UserRepository.updateRole(req.params.id, role);
    res.json(updated);
  },
};
