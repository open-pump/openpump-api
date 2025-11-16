import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { tokenService } from '../services/tokenService';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { TokenAddressSchema } from '../types';
import { z } from 'zod';

const SimulateTradeSchema = z.object({
  amount: z.number().positive(),
});

const TokensListSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  sort: z.enum(['created_timestamp', 'last_trade_timestamp', 'market_cap', 'volume_24h']).optional().default('last_trade_timestamp'),
  order: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  category: z.enum(['new', 'rising', 'final_stretch', 'graduated', 'all']).optional().default('all'),
});

export async function tokenRoutes(fastify: FastifyInstance) {
  // Apply auth and rate limiting to all routes (skip in test mode)
  const isTestMode = process.env.TEST_MODE === 'true';

  if (!isTestMode) {
    fastify.addHook('onRequest', authMiddleware);
    fastify.addHook('onRequest', rateLimitMiddleware);
  } else {
    console.log('⚠️  Running in TEST MODE - authentication and rate limiting disabled');
  }

  // GET /v1/tokens - List tokens with filtering and sorting
  fastify.get(
    '/tokens',
    {
      schema: {
        description: 'List Pump.fun tokens with filtering by category and sorting options',
        tags: ['Tokens'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of tokens to return (1-100)', default: 50 },
            offset: { type: 'number', description: 'Pagination offset', default: 0 },
            sort: {
              type: 'string',
              enum: ['created_timestamp', 'last_trade_timestamp', 'market_cap', 'volume_24h'],
              description: 'Sort field',
              default: 'last_trade_timestamp'
            },
            order: { type: 'string', enum: ['ASC', 'DESC'], description: 'Sort order', default: 'DESC' },
            category: {
              type: 'string',
              enum: ['new', 'rising', 'final_stretch', 'graduated', 'all'],
              description: 'Filter by category',
              default: 'all'
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: z.infer<typeof TokensListSchema> }>, reply: FastifyReply) => {
      const params = TokensListSchema.parse(request.query);

      const tokens = await tokenService.listTokens(params);

      return {
        success: true,
        data: tokens,
        meta: {
          limit: params.limit,
          offset: params.offset,
          count: tokens.length,
        },
        timestamp: new Date().toISOString(),
      };
    }
  );

  // GET /v1/tokens/:address - Complete token data
  fastify.get(
    '/tokens/:address',
    {
      schema: {
        description: 'Get complete token data including metadata, bonding curve, and price',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
      },
    },
    async (request: FastifyRequest<{ Params: { address: string } }>, reply: FastifyReply) => {
      const { address } = TokenAddressSchema.parse(request.params);

      const tokenData = await tokenService.getCompleteTokenData(address);

      if (!tokenData) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'TOKEN_NOT_FOUND',
            message: 'Token not found or data unavailable',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: tokenData,
        timestamp: new Date().toISOString(),
      };
    }
  );

  // GET /v1/tokens/:address/metadata - Token metadata only
  fastify.get(
    '/tokens/:address/metadata',
    {
      schema: {
        description: 'Get token metadata including name, symbol, image, and social links',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
      },
    },
    async (request: FastifyRequest<{ Params: { address: string } }>, reply: FastifyReply) => {
      const { address } = TokenAddressSchema.parse(request.params);

      const metadata = await tokenService.getTokenMetadata(address);

      if (!metadata) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'METADATA_NOT_FOUND',
            message: 'Token metadata not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: metadata,
        timestamp: new Date().toISOString(),
      };
    }
  );

  // GET /v1/tokens/:address/bonding - Bonding curve data only
  fastify.get(
    '/tokens/:address/bonding',
    {
      schema: {
        description: 'Get bonding curve data including progress, SOL raised, and graduation status',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
      },
    },
    async (request: FastifyRequest<{ Params: { address: string } }>, reply: FastifyReply) => {
      const { address } = TokenAddressSchema.parse(request.params);

      const bonding = await tokenService.getBondingCurve(address);

      if (!bonding) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'BONDING_CURVE_NOT_FOUND',
            message: 'Bonding curve not found - token may be pre-bonded or graduated',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: bonding,
        timestamp: new Date().toISOString(),
      };
    }
  );

  // GET /v1/tokens/:address/price - Price data only
  fastify.get(
    '/tokens/:address/price',
    {
      schema: {
        description: 'Get current token price from bonding curve or DEX',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
      },
    },
    async (request: FastifyRequest<{ Params: { address: string } }>, reply: FastifyReply) => {
      const { address } = TokenAddressSchema.parse(request.params);

      const price = await tokenService.getTokenPrice(address);

      if (!price) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'PRICE_NOT_FOUND',
            message: 'Price data not available',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: price,
        timestamp: new Date().toISOString(),
      };
    }
  );

  // POST /v1/tokens/:address/simulate-buy - Simulate a buy trade
  fastify.post(
    '/tokens/:address/simulate-buy',
    {
      schema: {
        description: 'Simulate a buy trade to calculate tokens out and price impact',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
        body: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'SOL amount to spend' },
          },
          required: ['amount'],
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { address: string };
        Body: { amount: number };
      }>,
      reply: FastifyReply
    ) => {
      const { address } = TokenAddressSchema.parse(request.params);
      const { amount } = SimulateTradeSchema.parse(request.body);

      const result = await tokenService.simulateBuy(address, amount);

      if (!result) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'SIMULATION_FAILED',
            message: 'Cannot simulate trade - bonding curve not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    }
  );

  // POST /v1/tokens/:address/simulate-sell - Simulate a sell trade
  fastify.post(
    '/tokens/:address/simulate-sell',
    {
      schema: {
        description: 'Simulate a sell trade to calculate SOL out and price impact',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
        body: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: 'Token amount to sell' },
          },
          required: ['amount'],
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { address: string };
        Body: { amount: number };
      }>,
      reply: FastifyReply
    ) => {
      const { address } = TokenAddressSchema.parse(request.params);
      const { amount } = SimulateTradeSchema.parse(request.body);

      const result = await tokenService.simulateSell(address, amount);

      if (!result) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'SIMULATION_FAILED',
            message: 'Cannot simulate trade - bonding curve not found',
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    }
  );

  // GET /v1/tokens/:address/ohlcv - Get OHLCV candlestick data via GeckoTerminal
  fastify.get(
    '/tokens/:address/ohlcv/:timeframe',
    {
      schema: {
        description: 'Get OHLCV candlestick data for a token (via GeckoTerminal)',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
            timeframe: {
              type: 'string',
              enum: ['day', 'hour', 'minute'],
              description: 'Candlestick timeframe'
            },
          },
          required: ['address', 'timeframe'],
        },
        querystring: {
          type: 'object',
          properties: {
            aggregate: { type: 'number', description: 'Aggregation period (e.g., 1, 5, 15 for minutes)', default: 1 },
            limit: { type: 'number', description: 'Number of candles to return', default: 100 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: { address: string; timeframe: string };
        Querystring: { aggregate?: number; limit?: number };
      }>,
      reply: FastifyReply
    ) => {
      const { address, timeframe } = request.params;
      const { aggregate = 1, limit = 100 } = request.query;

      try {
        // First get the pool address for this token from GeckoTerminal
        const searchResponse = await fetch(
          `https://api.geckoterminal.com/api/v2/search/pools?query=${address}&network=solana`
        );
        const searchData = await searchResponse.json() as { data?: Array<{ id: string }> };

        if (!searchData.data || searchData.data.length === 0) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'POOL_NOT_FOUND',
              message: 'No liquidity pool found for this token on GeckoTerminal',
            },
            timestamp: new Date().toISOString(),
          });
        }

        // Get the first pool (most liquid)
        const poolId = searchData.data[0].id;
        const poolAddress = poolId.split('_')[1]; // Format: solana_poolAddress

        // Fetch OHLCV data
        const ohlcvResponse = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/ohlcv/${timeframe}?aggregate=${aggregate}&limit=${limit}`
        );
        const ohlcvData = await ohlcvResponse.json();

        return {
          success: true,
          data: ohlcvData,
          meta: {
            token: address,
            pool: poolAddress,
            timeframe,
            aggregate,
            source: 'geckoterminal',
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'OHLCV_FETCH_ERROR',
            message: 'Failed to fetch OHLCV data from GeckoTerminal',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /v1/tokens/:address/trades - Get recent trades via GeckoTerminal
  fastify.get(
    '/tokens/:address/trades',
    {
      schema: {
        description: 'Get recent trades for a token (via GeckoTerminal)',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
      },
    },
    async (request: FastifyRequest<{ Params: { address: string } }>, reply: FastifyReply) => {
      const { address } = request.params;

      try {
        // Get pool address
        const searchResponse = await fetch(
          `https://api.geckoterminal.com/api/v2/search/pools?query=${address}&network=solana`
        );
        const searchData = await searchResponse.json() as { data?: Array<{ id: string }> };

        if (!searchData.data || searchData.data.length === 0) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'POOL_NOT_FOUND',
              message: 'No liquidity pool found for this token',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const poolAddress = searchData.data[0].id.split('_')[1];

        // Fetch trades
        const tradesResponse = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}/trades`
        );
        const tradesData = await tradesResponse.json();

        return {
          success: true,
          data: tradesData,
          meta: {
            token: address,
            pool: poolAddress,
            source: 'geckoterminal',
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'TRADES_FETCH_ERROR',
            message: 'Failed to fetch trades from GeckoTerminal',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // GET /v1/tokens/:address/stats - Get token statistics via GeckoTerminal
  fastify.get(
    '/tokens/:address/stats',
    {
      schema: {
        description: 'Get token statistics including 24h volume, price change, etc.',
        tags: ['Tokens'],
        params: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'Token mint address' },
          },
          required: ['address'],
        },
      },
    },
    async (request: FastifyRequest<{ Params: { address: string } }>, reply: FastifyReply) => {
      const { address } = request.params;

      try {
        // Get pool info which includes stats
        const searchResponse = await fetch(
          `https://api.geckoterminal.com/api/v2/search/pools?query=${address}&network=solana`
        );
        const searchData = await searchResponse.json() as { data?: Array<{ id: string; attributes?: unknown }> };

        if (!searchData.data || searchData.data.length === 0) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'POOL_NOT_FOUND',
              message: 'No liquidity pool found for this token',
            },
            timestamp: new Date().toISOString(),
          });
        }

        const pool = searchData.data[0];
        const poolAddress = pool.id.split('_')[1];

        // Get detailed pool info
        const poolResponse = await fetch(
          `https://api.geckoterminal.com/api/v2/networks/solana/pools/${poolAddress}`
        );
        const poolData = await poolResponse.json();

        return {
          success: true,
          data: poolData,
          meta: {
            token: address,
            pool: poolAddress,
            source: 'geckoterminal',
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'STATS_FETCH_ERROR',
            message: 'Failed to fetch stats from GeckoTerminal',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  );
}
