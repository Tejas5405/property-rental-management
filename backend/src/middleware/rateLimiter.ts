import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Keep tests hermetic and consistent with the app's convention of skipping
  // side-effectful middleware under NODE_ENV=test (see logging in app.ts).
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many requests, please try again later' },
});
