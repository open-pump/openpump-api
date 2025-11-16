import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../models/database';
import { cache, CacheKeys } from '../utils/cache';
import { ApiKey } from '../types';

// Extend FastifyRequest to include apiKey
declare module 'fastify' {
  interface FastifyRequest {
    apiKey?: ApiKey;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Extract API key from header
  const authHeader = request.headers.authorization;
  const apiKeyFromHeader = authHeader?.replace('Bearer ', '');

  // Also check query param for API key (less secure but convenient)
  const apiKeyFromQuery = request.query as { api_key?: string };
  const apiKey = apiKeyFromHeader || apiKeyFromQuery.api_key;

  if (!apiKey) {
    return reply.code(401).send({
      success: false,
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required. Provide it in Authorization header or api_key query param.',
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Try to get API key from cache first
  let apiKeyData = await cache.get<ApiKey>(CacheKeys.apiKeyData(apiKey));

  // If not in cache, fetch from database
  if (!apiKeyData) {
    const result = await db.queryOne<ApiKey>(
      `SELECT
        ak.id,
        ak.key,
        ak.tier,
        ak.user_id as "userId",
        ak.created_at as "createdAt",
        ak.last_used_at as "lastUsedAt",
        ak.is_active as "isActive",
        CASE
          WHEN ak.tier = 'free' THEN $2
          WHEN ak.tier = 'starter' THEN $3
          WHEN ak.tier = 'pro' THEN $4
          WHEN ak.tier = 'elite' THEN $5
          ELSE $2
        END as "rateLimit"
      FROM api_keys ak
      WHERE ak.key = $1 AND ak.is_active = TRUE`,
      [apiKey, 100, 10000, 100000, 1000000]
    );

    if (!result) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or inactive API key.',
        },
        timestamp: new Date().toISOString(),
      });
    }

    apiKeyData = result;

    // Cache for 5 minutes
    await cache.set(CacheKeys.apiKeyData(apiKey), apiKeyData, 300);
  }

  // Update last_used_at (async, don't wait)
  db.query(
    'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
    [apiKeyData.id]
  ).catch((err) => console.error('Failed to update last_used_at:', err));

  // Attach to request
  request.apiKey = apiKeyData;
}

// Optional auth middleware (allows unauthenticated requests)
export async function optionalAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;
  const apiKeyFromHeader = authHeader?.replace('Bearer ', '');
  const apiKeyFromQuery = request.query as { api_key?: string };
  const apiKey = apiKeyFromHeader || apiKeyFromQuery.api_key;

  if (!apiKey) {
    // No API key provided, continue without auth
    return;
  }

  // If API key provided, validate it
  try {
    await authMiddleware(request, reply);
  } catch (error) {
    // If validation fails, continue without auth (optional auth)
    return;
  }
}
