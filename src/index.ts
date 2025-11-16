import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { db } from './models/database';
import { cache, CacheKeys } from './utils/cache';
import { realtimeTokenService, NewTokenEvent, TradeEvent } from './services/realtimeTokenService';
import { ApiKey } from './types';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      config.server.env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
});

// Register plugins
async function registerPlugins() {
  // CORS
  await fastify.register(cors, {
    origin: config.server.env === 'production' ? ['https://openpump.io'] : true,
    credentials: true,
  });

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for Swagger UI
  });

  // Swagger documentation
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'OpenPump API',
        description: 'Open source Pump.fun intelligence API',
        version: '0.1.0',
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'API Key',
          },
          apiKey: {
            type: 'apiKey',
            name: 'api_key',
            in: 'query',
          },
        },
      },
      security: [{ bearerAuth: [] }, { apiKey: [] }],
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // WebSocket support for real-time streaming
  await fastify.register(websocket);
}

// Register routes
async function registerRoutes() {
  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Root endpoint
  fastify.get('/', async () => {
    return {
      name: 'OpenPump API',
      version: '0.1.0',
      description: 'Open source Pump.fun intelligence API',
      docs: '/docs',
      status: 'operational',
      endpoints: {
        tokens: '/v1/tokens/:address',
        metadata: '/v1/tokens/:address/metadata',
        bonding: '/v1/tokens/:address/bonding',
        price: '/v1/tokens/:address/price',
        websocket: 'ws://localhost:' + config.server.port + '/v1/stream',
      },
      realtime: realtimeTokenService.getStatus(),
    };
  });

  // Register API routes
  const { tokenRoutes } = await import('./routes/tokenRoutes');
  await fastify.register(tokenRoutes, { prefix: '/v1' });

  // WebSocket endpoint for real-time token stream
  const connectedClients = new Set<any>();

  // Helper to validate API key for WebSocket
  const validateWebSocketApiKey = async (apiKeyString: string): Promise<ApiKey | null> => {
    // Check cache first
    let apiKeyData = await cache.get<ApiKey>(CacheKeys.apiKeyData(apiKeyString));

    if (!apiKeyData) {
      const result = await db.queryOne<ApiKey>(
        `SELECT
          ak.id,
          ak.key,
          ak.tier,
          ak.user_id as "userId",
          ak.created_at as "createdAt",
          ak.last_used_at as "lastUsedAt",
          ak.is_active as "isActive"
        FROM api_keys ak
        WHERE ak.key = $1 AND ak.is_active = TRUE`,
        [apiKeyString]
      );

      if (result) {
        apiKeyData = result;
        await cache.set(CacheKeys.apiKeyData(apiKeyString), apiKeyData, 300);
      }
    }

    return apiKeyData || null;
  };

  fastify.get('/v1/stream', { websocket: true }, async (socket, req) => {
    console.log('New WebSocket client connection attempt');

    // Skip auth in test mode
    const isTestMode = process.env.TEST_MODE === 'true';

    if (!isTestMode) {
      // Extract API key from query params
      const url = new URL(req.url, `http://${req.headers.host}`);
      const apiKeyString = url.searchParams.get('api_key');

      if (!apiKeyString) {
        socket.send(
          JSON.stringify({
            type: 'error',
            code: 'MISSING_API_KEY',
            message: 'API key required. Connect with: ws://api.openpump.io/v1/stream?api_key=YOUR_KEY',
            timestamp: Date.now(),
          })
        );
        socket.close(4001, 'API key required');
        return;
      }

      const apiKeyData = await validateWebSocketApiKey(apiKeyString);

      if (!apiKeyData) {
        socket.send(
          JSON.stringify({
            type: 'error',
            code: 'INVALID_API_KEY',
            message: 'Invalid or inactive API key',
            timestamp: Date.now(),
          })
        );
        socket.close(4001, 'Invalid API key');
        return;
      }

      // Check if user has paid plan (pro or elite)
      const allowedTiers = ['pro', 'elite'];
      if (!allowedTiers.includes(apiKeyData.tier)) {
        socket.send(
          JSON.stringify({
            type: 'error',
            code: 'PLAN_RESTRICTION',
            message: `Real-time streaming requires Pro or Elite plan. Current plan: ${apiKeyData.tier}. Upgrade at https://openpump.io/pricing`,
            timestamp: Date.now(),
          })
        );
        socket.close(4001, 'Plan upgrade required');
        return;
      }

      console.log(`WebSocket authenticated: ${apiKeyData.tier} plan`);
    } else {
      console.log('WebSocket: TEST_MODE enabled, skipping auth');
    }

    console.log('New WebSocket client connected');
    connectedClients.add(socket);

    // Send welcome message
    socket.send(
      JSON.stringify({
        type: 'connected',
        message: 'Connected to OpenPump real-time stream',
        timestamp: Date.now(),
        status: realtimeTokenService.getStatus(),
      })
    );

    // Handle client messages (for subscriptions, filters, etc.)
    socket.on('message', (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (data.type === 'status') {
          socket.send(
            JSON.stringify({
              type: 'status',
              data: realtimeTokenService.getStatus(),
              timestamp: Date.now(),
            })
          );
        }
      } catch (err) {
        // Ignore parse errors
      }
    });

    socket.on('close', () => {
      console.log('WebSocket client disconnected');
      connectedClients.delete(socket);
    });
  });

  // Wire up realtime service events to broadcast to all WebSocket clients
  const broadcastToClients = (event: any) => {
    const message = JSON.stringify(event);
    for (const client of connectedClients) {
      try {
        client.send(message);
      } catch (err) {
        // Remove dead connections
        connectedClients.delete(client);
      }
    }
  };

  realtimeTokenService.on('new_token', (event: NewTokenEvent) => {
    console.log(`Broadcasting new token: ${event.mint}`);
    broadcastToClients(event);
  });

  realtimeTokenService.on('token_enriched', (event: NewTokenEvent) => {
    console.log(`Broadcasting enriched token data: ${event.mint}`);
    broadcastToClients({ ...event, type: 'token_enriched' });
  });

  realtimeTokenService.on('trade', (event: TradeEvent) => {
    broadcastToClients(event);
  });
}

// Error handler
fastify.setErrorHandler(errorHandler);

// Graceful shutdown
async function closeGracefully(signal: string) {
  console.log(`Received signal ${signal}, closing gracefully...`);

  await realtimeTokenService.stop();
  await fastify.close();
  await db.close();
  await cache.close();

  process.exit(0);
}

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
async function start() {
  try {
    // Register plugins and routes
    await registerPlugins();
    await registerRoutes();

    // Start listening
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    // Start realtime token monitoring
    await realtimeTokenService.start();

    console.log(`
┌─────────────────────────────────────────────┐
│                                             │
│   OpenPump API Server Running              │
│                                             │
│   Environment: ${config.server.env.padEnd(28)}│
│   Port: ${config.server.port.toString().padEnd(35)}│
│   Docs: http://localhost:${config.server.port}/docs       │
│   WebSocket: ws://localhost:${config.server.port}/v1/stream│
│   Real-time: ACTIVE                         │
│                                             │
└─────────────────────────────────────────────┘
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
