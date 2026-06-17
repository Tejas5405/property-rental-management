import { NextFunction, Request, Response } from 'express';

type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps an async route handler so thrown errors reach the global error handler. */
export function asyncHandler(fn: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
