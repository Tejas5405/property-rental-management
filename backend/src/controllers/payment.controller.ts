import { Request, Response } from 'express';
import { PaymentRepository } from '../repositories/payment.repository';
import { AgreementRepository } from '../repositories/agreement.repository';
import { PropertyRepository } from '../repositories/property.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { HttpError, User } from '../types';

function requireUser(req: Request): User {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  return req.user;
}

/** Throws 403 unless the user may access payments for the given agreement. */
async function assertAgreementAccess(user: User, agreementId: string): Promise<void> {
  if (user.role === 'admin') return;
  const agreement = await AgreementRepository.findById(agreementId);
  if (!agreement) throw new HttpError(404, 'Agreement not found');
  if (user.role === 'manager') {
    const property = await PropertyRepository.findById(agreement.property_id);
    if (!property || property.manager_id !== user.id) throw new HttpError(403, 'Forbidden');
    return;
  }
  // tenant
  const tenant = await TenantRepository.findByUserId(user.id);
  if (!tenant || agreement.tenant_id !== tenant.id) throw new HttpError(403, 'Forbidden');
}

export const PaymentController = {
  // GET /api/payments?agreementId=  (scoped by role)
  async list(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const agreementId = typeof req.query.agreementId === 'string' ? req.query.agreementId : undefined;

    if (agreementId) {
      await assertAgreementAccess(user, agreementId);
      res.json(await PaymentRepository.findByAgreement(agreementId));
      return;
    }

    // No agreementId: return everything the role is allowed to see.
    if (user.role === 'admin') {
      const all = await AgreementRepository.findAll();
      res.json(await PaymentRepository.findByAgreementIds(all.map((a) => a.id)));
    } else if (user.role === 'manager') {
      const props = await PropertyRepository.findAll({ managerId: user.id });
      const agreements = await AgreementRepository.findByPropertyIds(props.map((p) => p.id));
      res.json(await PaymentRepository.findByAgreementIds(agreements.map((a) => a.id)));
    } else {
      const tenant = await TenantRepository.findByUserId(user.id);
      const agreements = tenant ? await AgreementRepository.findAll({ tenantId: tenant.id }) : [];
      res.json(await PaymentRepository.findByAgreementIds(agreements.map((a) => a.id)));
    }
  },

  // POST /api/payments  (admin, manager)
  async create(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const { agreement_id, amount, due_date, status, method } = req.body ?? {};
    if (!agreement_id || amount === undefined || !due_date) {
      throw new HttpError(400, 'agreement_id, amount and due_date are required');
    }
    await assertAgreementAccess(user, agreement_id);
    const payment = await PaymentRepository.create({
      agreement_id,
      amount,
      due_date,
      status: status ?? 'pending',
      method: method ?? null,
    });
    res.status(201).json(payment);
  },

  // PUT /api/payments/:id  (admin, manager — mark paid)
  async markPaid(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const payment = await PaymentRepository.findById(req.params.id);
    if (!payment) throw new HttpError(404, 'Payment not found');
    await assertAgreementAccess(user, payment.agreement_id);
    const method = req.body?.method ?? payment.method ?? 'card';
    res.json(await PaymentRepository.markPaid(req.params.id, method));
  },

  // GET /api/payments/summary?month=&year=
  async summary(req: Request, res: Response): Promise<void> {
    const now = new Date();
    const month = req.query.month ? Number(req.query.month) : now.getUTCMonth() + 1;
    const year = req.query.year ? Number(req.query.year) : now.getUTCFullYear();
    if (Number.isNaN(month) || Number.isNaN(year)) throw new HttpError(400, 'Invalid month/year');
    res.json(await PaymentRepository.summary(month, year));
  },
};
