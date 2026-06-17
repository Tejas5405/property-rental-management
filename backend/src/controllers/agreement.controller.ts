import { Request, Response } from 'express';
import { AgreementRepository } from '../repositories/agreement.repository';
import { PropertyRepository } from '../repositories/property.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { AgreementService } from '../services/agreement.service';
import { Agreement, HttpError, User } from '../types';

function requireUser(req: Request): User {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  return req.user;
}

async function managerPropertyIds(managerId: string): Promise<string[]> {
  const props = await PropertyRepository.findAll({ managerId });
  return props.map((p) => p.id);
}

export const AgreementController = {
  // GET /api/agreements  (scoped by role)
  async list(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    let agreements: Agreement[];
    if (user.role === 'admin') {
      agreements = await AgreementRepository.findAll();
    } else if (user.role === 'manager') {
      agreements = await AgreementRepository.findByPropertyIds(await managerPropertyIds(user.id));
    } else {
      const tenant = await TenantRepository.findByUserId(user.id);
      agreements = tenant ? await AgreementRepository.findAll({ tenantId: tenant.id }) : [];
    }
    res.json(agreements);
  },

  // POST /api/agreements  (admin, manager)
  async create(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { property_id, tenant_id, start_date, end_date, rent, deposit } = req.body ?? {};
    if (!property_id || !tenant_id || !start_date || !end_date || rent === undefined) {
      throw new HttpError(400, 'property_id, tenant_id, start_date, end_date and rent are required');
    }
    if (user.role === 'manager') {
      const property = await PropertyRepository.findById(property_id);
      if (!property || property.manager_id !== user.id) {
        throw new HttpError(403, 'Forbidden: not your property');
      }
    }
    const agreement = await AgreementService.create({ property_id, tenant_id, start_date, end_date, rent, deposit });
    res.status(201).json(agreement);
  },

  // PUT /api/agreements/:id/renew  (admin, manager)
  async renew(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { end_date } = req.body ?? {};
    if (!end_date) throw new HttpError(400, 'end_date is required');
    await assertManagerOwnsAgreement(user, req.params.id);
    res.json(await AgreementService.renew(req.params.id, end_date));
  },

  // PUT /api/agreements/:id/terminate  (admin, manager)
  async terminate(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    await assertManagerOwnsAgreement(user, req.params.id);
    res.json(await AgreementService.terminate(req.params.id));
  },
};

async function assertManagerOwnsAgreement(user: User, agreementId: string): Promise<void> {
  if (user.role !== 'manager') return;
  const agreement = await AgreementRepository.findById(agreementId);
  if (!agreement) throw new HttpError(404, 'Agreement not found');
  const property = await PropertyRepository.findById(agreement.property_id);
  if (!property || property.manager_id !== user.id) {
    throw new HttpError(403, 'Forbidden: not your property');
  }
}
