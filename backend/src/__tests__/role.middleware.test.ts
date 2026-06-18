import { Request, Response } from 'express';
import { requireRole } from '../middleware/role.middleware';
import { User } from '../types';

function mockRes() {
  const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = jest.fn().mockImplementation((body: unknown) => {
    res.body = body;
    return res as Response;
  });
  return res as Response & { statusCode?: number; body?: unknown };
}

const adminUser = { id: '1', role: 'admin' } as User;
const tenantUser = { id: '2', role: 'tenant' } as User;

describe('requireRole middleware', () => {
  it('calls next() when the role is allowed', () => {
    const next = jest.fn();
    const res = mockRes();
    requireRole('admin', 'manager')({ user: adminUser } as Request, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('responds 403 when the role is not allowed', () => {
    const next = jest.fn();
    const res = mockRes();
    requireRole('admin')({ user: tenantUser } as Request, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it('responds 401 when no user is attached', () => {
    const next = jest.fn();
    const res = mockRes();
    requireRole('admin')({} as Request, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});
