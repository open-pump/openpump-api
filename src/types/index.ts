import { z } from 'zod';

// API Tiers
export type ApiTier = 'free' | 'starter' | 'pro' | 'elite';

// API Key
export interface ApiKey {
  id: string;
  key: string;
  tier: ApiTier;
  userId: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
  rateLimit: number;
}

// Token Categories
export type TokenCategory = 'new' | 'final-stretch' | 'graduated' | 'unknown';

// Bonding Curve Data
export interface BondingCurve {
  mint: string;
  bondingCurve: string;
  progress: number; // 0-100
  solRaised: number;
  solRemaining: number;
  virtualSolReserves: number;
  virtualTokenReserves: number;
  realSolReserves: number;
  realTokenReserves: number;
  currentPrice: number;
  marketCap: number;
  category: TokenCategory;
  complete: boolean;
  createdAt: string;
}

// Token Metadata
export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  decimals: number;
  supply: string;
  creator?: string;
  createdAt?: string;
  uri?: string;
  qualityScore: number;
  socialLinks: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  };
  hasSocial: boolean;
}

// Token Price
export interface TokenPrice {
  mint: string;
  priceUsd: number;
  priceSol: number;
  marketCapUsd: number;
  liquidityUsd: number;
  volume24h?: number;
  priceChange24h?: number;
  source: 'geckoterminal' | 'jupiter' | 'bonding-curve';
  timestamp: string;
}

// Token Pair
export interface TokenPair {
  pairAddress: string;
  dex: string;
  baseToken: string;
  quoteToken: string;
  priceUsd: number;
  liquidityUsd: number;
  volume24h: number;
  priceChange24h: number;
  fdv: number;
  poolCreatedAt?: string;
}

// Complete Token Data
export interface TokenData {
  mint: string;
  metadata: TokenMetadata;
  bonding?: BondingCurve;
  price?: TokenPrice;
  pairs?: TokenPair[];
  category: TokenCategory;
  lastUpdated: string;
}

// Discovery Response
export interface TokenDiscoveryResponse {
  tokens: TokenData[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  requestId?: string;
}

// Validation Schemas
export const TokenAddressSchema = z.object({
  address: z.string().min(32).max(44).regex(/^[1-9A-HJ-NP-Za-km-z]+$/),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const CategorySchema = z.object({
  category: z.enum(['new', 'final-stretch', 'graduated', 'all']).default('all'),
});

export const SearchSchema = z.object({
  q: z.string().min(1).max(100),
  minQuality: z.coerce.number().min(0).max(100).optional(),
  hasSocial: z.coerce.boolean().optional(),
});

export const SortSchema = z.object({
  sortBy: z.enum(['created', 'quality', 'volume', 'marketcap']).default('created'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Configuration
export interface Config {
  server: {
    port: number;
    host: string;
    env: string;
  };
  database: {
    url: string;
    maxConnections: number;
  };
  redis: {
    url: string;
    password?: string;
  };
  solana: {
    rpcUrl: string;
    heliusApiKey?: string;
  };
  rateLimit: {
    free: number;
    starter: number;
    pro: number;
    elite: number;
  };
  cache: {
    ttl: {
      tokenMetadata: number;
      tokenPrice: number;
      bondingCurve: number;
      recentTokens: number;
    };
  };
}
