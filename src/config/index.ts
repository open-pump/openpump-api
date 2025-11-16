import dotenv from 'dotenv';
import { Config } from '../types';

dotenv.config();

export const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.API_HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/openpump',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20', 10),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  },
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    heliusApiKey: process.env.HELIUS_API_KEY,
  },
  rateLimit: {
    free: parseInt(process.env.RATE_LIMIT_FREE || '100', 10),
    starter: parseInt(process.env.RATE_LIMIT_STARTER || '10000', 10),
    pro: parseInt(process.env.RATE_LIMIT_PRO || '100000', 10),
    elite: parseInt(process.env.RATE_LIMIT_ELITE || '1000000', 10),
  },
  cache: {
    ttl: {
      tokenMetadata: parseInt(process.env.CACHE_TTL_TOKEN_METADATA || '300', 10),
      tokenPrice: parseInt(process.env.CACHE_TTL_TOKEN_PRICE || '10', 10),
      bondingCurve: parseInt(process.env.CACHE_TTL_BONDING_CURVE || '30', 10),
      recentTokens: parseInt(process.env.CACHE_TTL_RECENT_TOKENS || '60', 10),
    },
  },
};

// Validate required config
if (!config.solana.heliusApiKey && config.server.env === 'production') {
  console.warn('⚠️  HELIUS_API_KEY not set - using public RPC (not recommended for production)');
}
