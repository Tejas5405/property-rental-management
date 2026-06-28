import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware that validates `req.body` against a Zod schema.
 * Returns a structured 422 response on failure; calls next() on success.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          error: 'Validation failed',
          details: err.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
