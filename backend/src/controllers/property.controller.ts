import { Request, Response } from 'express';
import { PropertyFilters, PropertyRepository } from '../repositories/property.repository';
import { AgreementRepository } from '../repositories/agreement.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { HttpError, User } from '../types';

function requireUser(req: Request): User {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  return req.user;
}

export const PropertyController = {
  // GET /api/properties  (admin: all; manager: own only)
  async list(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const filters: PropertyFilters = {
      status: req.query.status as PropertyFilters['status'],
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    };
    if (user.role === 'manager') filters.managerId = user.id;
    res.json(await PropertyRepository.findAll(filters));
  },

  // GET /api/properties/:id
  async get(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const property = await PropertyRepository.findById(req.params.id);
    if (!property) throw new HttpError(404, 'Property not found');
    if (user.role === 'manager' && property.manager_id !== user.id) {
      throw new HttpError(403, 'Forbidden: not your property');
    }
    if (user.role === 'tenant') {
      // Tenants may only view a property they currently lease.
      const tenant = await TenantRepository.findByUserId(user.id);
      const active = await AgreementRepository.findActiveForProperty(property.id);
      if (!tenant || !active || active.tenant_id !== tenant.id) {
        throw new HttpError(403, 'Forbidden');
      }
    }
    res.json(property);
  },

  // POST /api/properties  (admin, manager)
  async create(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { name, address, type, rent, bedrooms, bathrooms, status, manager_id } = req.body ?? {};
    if (!name || !address || !type) throw new HttpError(400, 'name, address and type are required');
    const property = await PropertyRepository.create({
      name,
      address,
      type,
      rent: rent ?? 0,
      bedrooms: bedrooms ?? 0,
      bathrooms: bathrooms ?? 0,
      status: status ?? 'vacant',
      // Managers can only create properties owned by themselves.
      manager_id: user.role === 'manager' ? user.id : manager_id ?? null,
    });
    res.status(201).json(property);
  },

  // PUT /api/properties/:id  (admin, assigned manager only)
  async update(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const property = await PropertyRepository.findById(req.params.id);
    if (!property) throw new HttpError(404, 'Property not found');
    if (user.role === 'manager' && property.manager_id !== user.id) {
      throw new HttpError(403, 'Forbidden: not your property');
    }
    const { name, address, type, rent, bedrooms, bathrooms, status } = req.body ?? {};
    const fields = { name, address, type, rent, bedrooms, bathrooms, status };
    // Managers may not reassign ownership.
    const cleaned = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (user.role === 'admin' && req.body?.manager_id !== undefined) {
      cleaned.manager_id = req.body.manager_id;
    }
    res.json(await PropertyRepository.update(req.params.id, cleaned));
  },

  // DELETE /api/properties/:id  (admin only)
  async remove(req: Request, res: Response): Promise<void> {
    const property = await PropertyRepository.findById(req.params.id);
    if (!property) throw new HttpError(404, 'Property not found');
    await PropertyRepository.remove(req.params.id);
    res.json({ success: true });
  },
};
