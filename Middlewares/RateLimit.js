import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter: max 100 requests per 15 minutes per IP.
 * Returns HTTP 429 with a JSON error body when the limit is exceeded.
 */
export const defaultLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate-limit info in `RateLimit-*` headers
  legacyHeaders: false,   // Disable the deprecated `X-RateLimit-*` headers
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the 100 requests per 15 minutes limit. Please try again later.'
  },
  statusCode: 429
});

export default defaultLimit;
