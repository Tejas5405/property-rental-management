import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/properties.routes';
import tenantRoutes from './routes/tenants.routes';
import agreementRoutes from './routes/agreements.routes';
import paymentRoutes from './routes/payments.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { HttpError } from './types';

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
      credentials: true,
    })
  );
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/properties', propertyRoutes);
  app.use('/api/tenants', tenantRoutes);
  app.use('/api/agreements', agreementRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  // 404 for unknown API routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler (must be last, 4 args)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = err instanceof HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (status >= 500) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(status).json({ error: message });
  });

  return app;
}
