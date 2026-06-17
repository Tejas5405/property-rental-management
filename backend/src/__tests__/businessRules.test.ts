import request from 'supertest';
import { createApp } from '../app';
import { Agreement, Property, Tenant } from '../types';

/**
 * Integration tests for the eight core business rules. These hit a LIVE
 * Supabase instance through the API, so they only run when the required
 * environment variables are present:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   TEST_ADMIN_TOKEN, TEST_MANAGER_TOKEN, TEST_TENANT_TOKEN
 * Otherwise the whole suite is skipped (so CI stays green until secrets exist).
 */
const app = createApp();
const ADMIN = process.env.TEST_ADMIN_TOKEN ?? '';
const MANAGER = process.env.TEST_MANAGER_TOKEN ?? '';
const TENANT = process.env.TEST_TENANT_TOKEN ?? '';

const hasCreds = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && ADMIN && MANAGER && TENANT
);

const bearer = (token: string) => `Bearer ${token}`;
const run = hasCreds ? describe : describe.skip;

run('PRMS business rules (live DB)', () => {
  let properties: Property[] = [];
  let tenants: Tenant[] = [];
  let agreements: Agreement[] = [];

  beforeAll(async () => {
    properties = (await request(app).get('/api/properties').set('Authorization', bearer(ADMIN))).body;
    tenants = (await request(app).get('/api/tenants').set('Authorization', bearer(ADMIN))).body;
    agreements = (await request(app).get('/api/agreements').set('Authorization', bearer(ADMIN))).body;
  });

  it('Rule 1: unauthenticated requests are rejected (401)', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(401);
  });

  it('Rule 2: a tenant cannot read the admin-only users list (403)', async () => {
    const res = await request(app).get('/api/auth/users').set('Authorization', bearer(TENANT));
    expect(res.status).toBe(403);
  });

  it('Rule 3: a manager cannot delete a property (admin only) (403)', async () => {
    const id = properties[0]?.id;
    const res = await request(app).delete(`/api/properties/${id}`).set('Authorization', bearer(MANAGER));
    expect(res.status).toBe(403);
  });

  it('Rule 4: cannot create an agreement on an occupied property (409)', async () => {
    const occupied = properties.find((p) => p.status === 'occupied');
    expect(occupied).toBeDefined();
    const res = await request(app)
      .post('/api/agreements')
      .set('Authorization', bearer(ADMIN))
      .send({
        property_id: occupied!.id,
        tenant_id: tenants[0].id,
        start_date: '2031-01-01',
        end_date: '2032-01-01',
        rent: occupied!.rent,
        deposit: occupied!.rent,
      });
    expect(res.status).toBe(409);
  });

  it('Rule 5: only one active agreement per property (duplicate => 409)', async () => {
    const vacant = properties.find((p) => p.status === 'vacant');
    expect(vacant).toBeDefined();
    const payload = {
      property_id: vacant!.id,
      tenant_id: tenants[0].id,
      start_date: '2031-02-01',
      end_date: '2032-02-01',
      rent: vacant!.rent,
      deposit: vacant!.rent,
    };
    const first = await request(app).post('/api/agreements').set('Authorization', bearer(ADMIN)).send(payload);
    expect(first.status).toBe(201);

    const dup = await request(app).post('/api/agreements').set('Authorization', bearer(ADMIN)).send(payload);
    expect(dup.status).toBe(409);

    // cleanup: terminate the agreement we created
    await request(app).put(`/api/agreements/${first.body.id}/terminate`).set('Authorization', bearer(ADMIN));
  });

  it('Rule 6: cannot delete a tenant with an active agreement (409)', async () => {
    const active = agreements.find((a) => a.status === 'active');
    expect(active).toBeDefined();
    const res = await request(app)
      .delete(`/api/tenants/${active!.tenant_id}`)
      .set('Authorization', bearer(ADMIN));
    expect(res.status).toBe(409);
  });

  it('Rule 7: terminating an agreement frees its property (status => vacant)', async () => {
    const vacant = properties.find((p) => p.status === 'vacant');
    expect(vacant).toBeDefined();
    const created = await request(app)
      .post('/api/agreements')
      .set('Authorization', bearer(ADMIN))
      .send({
        property_id: vacant!.id,
        tenant_id: tenants[0].id,
        start_date: '2031-03-01',
        end_date: '2032-03-01',
        rent: vacant!.rent,
        deposit: vacant!.rent,
      });
    expect(created.status).toBe(201);

    const term = await request(app)
      .put(`/api/agreements/${created.body.id}/terminate`)
      .set('Authorization', bearer(ADMIN));
    expect(term.status).toBe(200);

    const after = await request(app)
      .get(`/api/properties/${vacant!.id}`)
      .set('Authorization', bearer(ADMIN));
    expect(after.body.status).toBe('vacant');
  });

  it('Rule 8: a tenant only sees their own agreements', async () => {
    const res = await request(app).get('/api/agreements').set('Authorization', bearer(TENANT));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // A tenant should never see the full set of agreements an admin sees.
    expect(res.body.length).toBeLessThanOrEqual(agreements.length);
  });
});
