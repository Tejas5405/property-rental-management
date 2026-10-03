import { Request, Response } from 'express';
import { TenantRepository } from '../repositories/tenant.repository';
import { HttpError, User } from '../types';

function requireUser(req: Request): User {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  return req.user;
}

export const TenantController = {
  // GET /api/tenants  (admin, manager)
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await TenantRepository.findAll());
  },

  // GET /api/tenants/me  (tenant — own record)
  async me(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const tenant = await TenantRepository.findByUserId(user.id);
    if (!tenant) throw new HttpError(404, 'No tenant profile linked to this account');
    res.json(tenant);
  },

  // GET /api/tenants/:id  (admin, manager, self)
  async get(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const tenant = await TenantRepository.findById(req.params.id);
    if (!tenant) throw new HttpError(404, 'Tenant not found');
    if (user.role === 'tenant' && tenant.user_id !== user.id) {
      throw new HttpError(403, 'Forbidden');
    }
    res.json(tenant);
  },

  // POST /api/tenants  (admin, manager)
  async create(req: Request, res: Response): Promise<void> {
    const { name, email, phone, user_id } = req.body;
    const tenant = await TenantRepository.create({ name, email, phone: phone ?? null, user_id: user_id ?? null });
    res.status(201).json(tenant);
  },

  // PUT /api/tenants/:id  (admin, manager, self — profile only)
  async update(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const tenant = await TenantRepository.findById(req.params.id);
    if (!tenant) throw new HttpError(404, 'Tenant not found');
    if (user.role === 'tenant' && tenant.user_id !== user.id) {
      throw new HttpError(403, 'Forbidden');
    }
    const { name, phone, email } = req.body;
    const fields: Record<string, unknown> = {};
    if (name !== undefined) fields.name = name;
    if (phone !== undefined) fields.phone = phone;
    // Only admins/managers may change a tenant's email.
    if (email !== undefined && user.role !== 'tenant') fields.email = email;
    res.json(await TenantRepository.update(req.params.id, fields));
  },

  // DELETE /api/tenants/:id  (admin only)
  async remove(req: Request, res: Response): Promise<void> {
    const tenant = await TenantRepository.findById(req.params.id);
    if (!tenant) throw new HttpError(404, 'Tenant not found');
    if (await TenantRepository.hasActiveAgreement(req.params.id)) {
      throw new HttpError(409, 'Cannot delete a tenant with an active agreement');
    }
    await TenantRepository.remove(req.params.id);
    res.json({ success: true });
  },
};
