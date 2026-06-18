import { AgreementRepository } from '../repositories/agreement.repository';
import { PropertyRepository } from '../repositories/property.repository';
import { Agreement, HttpError } from '../types';

export interface CreateAgreementInput {
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent: number;
  deposit?: number;
}

/**
 * Business logic for agreements. Enforces the "one active agreement per
 * property" rule at the application layer (DB partial unique index is the
 * second line of defense) and keeps property occupancy consistent on
 * terminate/renew (the Postgres trigger is the primary mechanism).
 */
export const AgreementService = {
  async create(input: CreateAgreementInput): Promise<Agreement> {
    const property = await PropertyRepository.findById(input.property_id);
    if (!property) throw new HttpError(404, 'Property not found');

    // Rule 1 (app layer): property must be vacant.
    if (property.status !== 'vacant') {
      throw new HttpError(409, `Property is ${property.status}; cannot create an active agreement`);
    }

    // Defensive: also reject if an active agreement somehow already exists.
    const existing = await AgreementRepository.findActiveForProperty(input.property_id);
    if (existing) {
      throw new HttpError(409, 'This property already has an active agreement');
    }

    return AgreementRepository.create({
      property_id: input.property_id,
      tenant_id: input.tenant_id,
      start_date: input.start_date,
      end_date: input.end_date,
      rent: input.rent,
      deposit: input.deposit ?? 0,
      status: 'active',
    });
  },

  async terminate(id: string): Promise<Agreement> {
    const agreement = await AgreementRepository.findById(id);
    if (!agreement) throw new HttpError(404, 'Agreement not found');
    if (agreement.status !== 'active') {
      throw new HttpError(409, `Only active agreements can be terminated (current: ${agreement.status})`);
    }
    const updated = await AgreementRepository.updateStatus(id, 'terminated');
    // Rule 2 (app-layer fallback): ensure property is vacant.
    await PropertyRepository.update(agreement.property_id, { status: 'vacant' });
    return updated;
  },

  async renew(id: string, newEndDate: string): Promise<Agreement> {
    const agreement = await AgreementRepository.findById(id);
    if (!agreement) throw new HttpError(404, 'Agreement not found');
    if (agreement.status !== 'active') {
      throw new HttpError(409, `Only active agreements can be renewed (current: ${agreement.status})`);
    }
    if (new Date(newEndDate) <= new Date(agreement.end_date)) {
      throw new HttpError(400, 'New end date must be after the current end date');
    }

    // Expire the old agreement first to free the partial unique index slot...
    await AgreementRepository.updateStatus(id, 'expired');
    // ...then create the new active agreement starting the day after the old end.
    const newStart = agreement.end_date;
    const created = await AgreementRepository.create({
      property_id: agreement.property_id,
      tenant_id: agreement.tenant_id,
      start_date: newStart,
      end_date: newEndDate,
      rent: agreement.rent,
      deposit: agreement.deposit,
      status: 'active',
    });
    // Fallback: ensure property remains occupied.
    await PropertyRepository.update(agreement.property_id, { status: 'occupied' });
    return created;
  },
};
