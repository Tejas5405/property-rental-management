import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('App smoke tests (no database required)', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects an unauthenticated protected request with 401', async () => {
    const res = await request(app).get('/api/properties');
    expect(res.status).toBe(401);
  });

  it('rejects a malformed Authorization header with 401', async () => {
    const res = await request(app).get('/api/properties').set('Authorization', 'not-a-bearer-token');
    expect(res.status).toBe(401);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
