import { FastifyRequest, FastifyReply } from 'fastify';
import { cache, CacheKeys } from '../utils/cache';

interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  defaultLimit?: number; // Default limit for unauthenticated requests
}

export function createRateLimitMiddleware(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60000; // Default 1 minute
  const defaultLimit = options.defaultLimit || 10; // Default 10 requests per minute for unauthenticated
  const windowSeconds = Math.floor(windowMs / 1000);

  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const apiKey = request.apiKey;
    const ip = request.ip;

    // Determine rate limit and identifier
    let limit: number;
    let identifier: string;

    if (apiKey) {
      // Use API key-based rate limiting
      limit = apiKey.rateLimit;
      identifier = apiKey.id;
    } else {
      // Use IP-based rate limiting for unauthenticated requests
      limit = defaultLimit;
      identifier = `ip:${ip}`;
    }

    // Calculate limit for this window (convert from per-day to per-minute)
    const limitPerWindow = Math.ceil(limit / (86400 / windowSeconds));

    // Get current window timestamp
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowKey = CacheKeys.rateLimitKey(identifier, windowStart.toString());

    // Increment counter
    const currentCount = await cache.incrementCounter(windowKey, windowSeconds);

    // Calculate remaining and reset time
    const remaining = Math.max(0, limitPerWindow - currentCount);
    const resetTime = windowStart + windowMs;

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', limitPerWindow.toString());
    reply.header('X-RateLimit-Remaining', remaining.toString());
    reply.header('X-RateLimit-Reset', resetTime.toString());

    // Check if limit exceeded
    if (currentCount > limitPerWindow) {
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return reply.code(429).send({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          details: {
            limit: limitPerWindow,
            windowSeconds,
            retryAfter,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
}

// Default rate limiter (1 minute window)
export const rateLimitMiddleware = createRateLimitMiddleware();

// Strict rate limiter (10 second window) for expensive endpoints
export const strictRateLimitMiddleware = createRateLimitMiddleware({
  windowMs: 10000, // 10 seconds
  defaultLimit: 2, // Only 2 requests per 10 seconds for unauthenticated
});
