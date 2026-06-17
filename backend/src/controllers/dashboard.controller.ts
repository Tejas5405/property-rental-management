import { Request, Response } from 'express';
import { PropertyRepository } from '../repositories/property.repository';
import { AgreementRepository } from '../repositories/agreement.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { TenantRepository } from '../repositories/tenant.repository';
import { HttpError, Payment, User } from '../types';

function requireUser(req: Request): User {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  return req.user;
}

interface MonthBucket {
  label: string;
  year: number;
  month: number;
  collected: number;
  due: number;
}

/** Builds 6 month buckets ending with the current month. */
function lastSixMonths(): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      label: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      collected: 0,
      due: 0,
    });
  }
  return buckets;
}

function bucketPayments(payments: Payment[]): MonthBucket[] {
  const buckets = lastSixMonths();
  for (const p of payments) {
    const due = new Date(p.due_date);
    const b = buckets.find((x) => x.year === due.getUTCFullYear() && x.month === due.getUTCMonth() + 1);
    if (!b) continue;
    b.due += Number(p.amount);
    if (p.status === 'paid') b.collected += Number(p.amount);
  }
  return buckets;
}

export const DashboardController = {
  // GET /api/dashboard/admin
  async admin(_req: Request, res: Response): Promise<void> {
    const properties = await PropertyRepository.findAll();
    const agreements = await AgreementRepository.findAll();
    const payments = await PaymentRepository.findByAgreementIds(agreements.map((a) => a.id));

    const occupied = properties.filter((p) => p.status === 'occupied').length;
    const vacant = properties.filter((p) => p.status === 'vacant').length;
    const maintenance = properties.filter((p) => p.status === 'maintenance').length;
    const revenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
    const outstanding = payments
      .filter((p) => p.status !== 'paid')
      .reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      kpis: {
        totalProperties: properties.length,
        occupied,
        vacant,
        revenue,
        outstanding,
      },
      occupancy: [
        { name: 'vacant', value: vacant },
        { name: 'occupied', value: occupied },
        { name: 'maintenance', value: maintenance },
      ],
      revenueSeries: bucketPayments(payments).map((b) => ({ label: b.label, revenue: b.collected })),
    });
  },

  // GET /api/dashboard/manager
  async manager(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const properties = await PropertyRepository.findAll({ managerId: user.id });
    const agreements = await AgreementRepository.findByPropertyIds(properties.map((p) => p.id));
    const payments = await PaymentRepository.findByAgreementIds(agreements.map((a) => a.id));

    const now = new Date();
    const collectedThisMonth = payments
      .filter((p) => {
        const d = new Date(p.due_date);
        return (
          p.status === 'paid' &&
          d.getUTCMonth() === now.getUTCMonth() &&
          d.getUTCFullYear() === now.getUTCFullYear()
        );
      })
      .reduce((s, p) => s + Number(p.amount), 0);

    res.json({
      kpis: {
        assignedProperties: properties.length,
        activeAgreements: agreements.filter((a) => a.status === 'active').length,
        collectedThisMonth,
      },
      paymentsSeries: bucketPayments(payments).map((b) => ({
        label: b.label,
        collected: b.collected,
        due: b.due,
      })),
    });
  },

  // GET /api/dashboard/tenant
  async tenant(req: Request, res: Response): Promise<void> {
    const user = requireUser(req);
    const tenant = await TenantRepository.findByUserId(user.id);
    if (!tenant) {
      res.json({ lease: null, nextPayment: null, payments: [] });
      return;
    }
    const agreements = await AgreementRepository.findAll({ tenantId: tenant.id });
    const active = agreements.find((a) => a.status === 'active') ?? agreements[0] ?? null;
    const payments = await PaymentRepository.findByAgreementIds(agreements.map((a) => a.id));
    const nextPayment =
      payments
        .filter((p) => p.status !== 'paid')
        .sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null;

    res.json({ lease: active, nextPayment, payments });
  },
};
