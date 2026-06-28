import { AgreementService } from '../services/agreement.service';
import { AgreementRepository } from '../repositories/agreement.repository';
import { PropertyRepository } from '../repositories/property.repository';
import { HttpError, Agreement, Property } from '../types';

jest.mock('../repositories/agreement.repository');
jest.mock('../repositories/property.repository');

const mockPropertyRepo = PropertyRepository as jest.Mocked<typeof PropertyRepository>;
const mockAgreementRepo = AgreementRepository as jest.Mocked<typeof AgreementRepository>;

const PROPERTY_ID = '00000000-0000-0000-0000-000000000001';
const TENANT_ID = '00000000-0000-0000-0000-000000000002';
const AGREEMENT_ID = '00000000-0000-0000-0000-000000000003';

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: PROPERTY_ID,
    name: 'Unit A',
    address: '123 Main St',
    type: 'apartment',
    status: 'vacant',
    rent: 1200,
    bedrooms: 2,
    bathrooms: 1,
    manager_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeAgreement(overrides: Partial<Agreement> = {}): Agreement {
  return {
    id: AGREEMENT_ID,
    property_id: PROPERTY_ID,
    tenant_id: TENANT_ID,
    start_date: '2025-01-01',
    end_date: '2026-01-01',
    rent: 1200,
    deposit: 1200,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

describe('AgreementService.create', () => {
  const input = {
    property_id: PROPERTY_ID,
    tenant_id: TENANT_ID,
    start_date: '2025-06-01',
    end_date: '2026-06-01',
    rent: 1200,
    deposit: 600,
  };

  it('creates an agreement when the property is vacant', async () => {
    mockPropertyRepo.findById.mockResolvedValue(makeProperty());
    mockAgreementRepo.findActiveForProperty.mockResolvedValue(null);
    const created = makeAgreement({ ...input, status: 'active' });
    mockAgreementRepo.create.mockResolvedValue(created);

    const result = await AgreementService.create(input);
    expect(result).toEqual(created);
    expect(mockAgreementRepo.create).toHaveBeenCalledWith({
      ...input,
      status: 'active',
    });
  });

  it('rejects with 404 when the property does not exist', async () => {
    mockPropertyRepo.findById.mockResolvedValue(null);

    await expect(AgreementService.create(input)).rejects.toThrow(HttpError);
    await expect(AgreementService.create(input)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('rejects with 409 when the property is occupied', async () => {
    mockPropertyRepo.findById.mockResolvedValue(makeProperty({ status: 'occupied' }));

    await expect(AgreementService.create(input)).rejects.toThrow(HttpError);
    await expect(AgreementService.create(input)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('rejects with 409 when the property is under maintenance', async () => {
    mockPropertyRepo.findById.mockResolvedValue(makeProperty({ status: 'maintenance' }));

    await expect(AgreementService.create(input)).rejects.toThrow(HttpError);
    await expect(AgreementService.create(input)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('rejects with 409 when an active agreement already exists (defensive check)', async () => {
    mockPropertyRepo.findById.mockResolvedValue(makeProperty());
    mockAgreementRepo.findActiveForProperty.mockResolvedValue(makeAgreement());

    await expect(AgreementService.create(input)).rejects.toThrow(HttpError);
    await expect(AgreementService.create(input)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('defaults deposit to 0 when not provided', async () => {
    mockPropertyRepo.findById.mockResolvedValue(makeProperty());
    mockAgreementRepo.findActiveForProperty.mockResolvedValue(null);
    mockAgreementRepo.create.mockResolvedValue(makeAgreement({ deposit: 0 }));

    const { deposit: _, ...inputWithoutDeposit } = input;
    await AgreementService.create(inputWithoutDeposit);
    expect(mockAgreementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ deposit: 0 })
    );
  });
});

describe('AgreementService.terminate', () => {
  it('terminates an active agreement and frees the property', async () => {
    const active = makeAgreement({ status: 'active' });
    mockAgreementRepo.findById.mockResolvedValue(active);
    mockAgreementRepo.updateStatus.mockResolvedValue(
      makeAgreement({ status: 'terminated' })
    );
    mockPropertyRepo.update.mockResolvedValue(makeProperty({ status: 'vacant' }));

    const result = await AgreementService.terminate(AGREEMENT_ID);
    expect(result.status).toBe('terminated');
    expect(mockPropertyRepo.update).toHaveBeenCalledWith(
      PROPERTY_ID,
      { status: 'vacant' }
    );
  });

  it('rejects with 404 when the agreement does not exist', async () => {
    mockAgreementRepo.findById.mockResolvedValue(null);

    await expect(AgreementService.terminate('nonexistent')).rejects.toThrow(HttpError);
    await expect(AgreementService.terminate('nonexistent')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('rejects with 409 when the agreement is already terminated', async () => {
    mockAgreementRepo.findById.mockResolvedValue(
      makeAgreement({ status: 'terminated' })
    );

    await expect(AgreementService.terminate(AGREEMENT_ID)).rejects.toThrow(HttpError);
    await expect(AgreementService.terminate(AGREEMENT_ID)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('rejects with 409 when the agreement is expired', async () => {
    mockAgreementRepo.findById.mockResolvedValue(
      makeAgreement({ status: 'expired' })
    );

    await expect(AgreementService.terminate(AGREEMENT_ID)).rejects.toThrow(HttpError);
    await expect(AgreementService.terminate(AGREEMENT_ID)).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe('AgreementService.renew', () => {
  const newEndDate = '2027-01-01';

  it('expires the old agreement and creates a new one', async () => {
    const active = makeAgreement({ status: 'active' });
    mockAgreementRepo.findById.mockResolvedValue(active);
    mockAgreementRepo.updateStatus.mockResolvedValue(
      makeAgreement({ status: 'expired' })
    );
    const renewed = makeAgreement({
      id: 'new-id',
      start_date: active.end_date,
      end_date: newEndDate,
    });
    mockAgreementRepo.create.mockResolvedValue(renewed);
    mockPropertyRepo.update.mockResolvedValue(makeProperty({ status: 'occupied' }));

    const result = await AgreementService.renew(AGREEMENT_ID, newEndDate);
    expect(result.end_date).toBe(newEndDate);
    expect(mockAgreementRepo.updateStatus).toHaveBeenCalledWith(AGREEMENT_ID, 'expired');
    expect(mockAgreementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        start_date: active.end_date,
        end_date: newEndDate,
        status: 'active',
      })
    );
    expect(mockPropertyRepo.update).toHaveBeenCalledWith(
      PROPERTY_ID,
      { status: 'occupied' }
    );
  });

  it('rejects with 404 when the agreement does not exist', async () => {
    mockAgreementRepo.findById.mockResolvedValue(null);

    await expect(AgreementService.renew('nonexistent', newEndDate)).rejects.toThrow(HttpError);
    await expect(AgreementService.renew('nonexistent', newEndDate)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('rejects with 409 when the agreement is not active', async () => {
    mockAgreementRepo.findById.mockResolvedValue(
      makeAgreement({ status: 'expired' })
    );

    await expect(AgreementService.renew(AGREEMENT_ID, newEndDate)).rejects.toThrow(HttpError);
    await expect(AgreementService.renew(AGREEMENT_ID, newEndDate)).rejects.toMatchObject({
      status: 409,
    });
  });

  it('rejects with 400 when new end date is before the current end date', async () => {
    mockAgreementRepo.findById.mockResolvedValue(makeAgreement());

    await expect(
      AgreementService.renew(AGREEMENT_ID, '2025-06-01')
    ).rejects.toThrow(HttpError);
    await expect(
      AgreementService.renew(AGREEMENT_ID, '2025-06-01')
    ).rejects.toMatchObject({ status: 400 });
  });

  it('rejects with 400 when new end date equals the current end date', async () => {
    const active = makeAgreement();
    mockAgreementRepo.findById.mockResolvedValue(active);

    await expect(
      AgreementService.renew(AGREEMENT_ID, active.end_date)
    ).rejects.toThrow(HttpError);
    await expect(
      AgreementService.renew(AGREEMENT_ID, active.end_date)
    ).rejects.toMatchObject({ status: 400 });
  });
});
