import { metadataService } from './metadataService';
import { bondingCurveService } from './bondingCurveService';
import { pricingService } from './pricingService';
import { tokenDiscoveryService } from './tokenDiscoveryService';
import { cache, CacheKeys } from '../utils/cache';
import { TokenData, TokenCategory } from '../types';

export class TokenService {
  async getCompleteTokenData(mint: string): Promise<TokenData | null> {
    // Try full cache first
    const cached = await cache.get<TokenData>(CacheKeys.tokenFull(mint));
    if (cached) {
      return cached;
    }

    try {
      // Fetch all data in parallel
      const [metadata, bonding, price] = await Promise.all([
        metadataService.getTokenMetadata(mint),
        bondingCurveService.getBondingCurve(mint),
        pricingService.getTokenPrice(mint),
      ]);

      // Debug logging
      console.log('Token data fetched:', {
        hasMetadata: !!metadata,
        hasBonding: !!bonding,
        hasPrice: !!price
      });

      // Only return null if we have NO data at all
      if (!metadata && !bonding && !price) {
        console.log('No data available for token:', mint);
        return null;
      }

      // Determine category (bonding curve takes priority if available)
      let category: TokenCategory = 'unknown';
      if (bonding) {
        category = bonding.category;
      } else if (price?.source === 'geckoterminal' || price?.source === 'jupiter') {
        // If we have DEX price but no bonding curve, likely graduated
        category = 'graduated';
      }

      const tokenData: TokenData = {
        mint,
        metadata: metadata || {
          mint,
          name: 'Unknown',
          symbol: 'UNKNOWN',
          decimals: 6,
          supply: '1000000000',
          qualityScore: 0,
          socialLinks: {},
          hasSocial: false,
        },
        bonding: bonding || undefined,
        price: price || undefined,
        category,
        lastUpdated: new Date().toISOString(),
      };

      console.log('Returning token data:', JSON.stringify(tokenData, null, 2).substring(0, 500));

      // Cache for 30 seconds (short TTL for full data)
      await cache.set(CacheKeys.tokenFull(mint), tokenData, 30);

      return tokenData;
    } catch (error) {
      console.error(`Error getting complete token data for ${mint}:`, error);
      return null;
    }
  }

  async getTokenMetadata(mint: string) {
    return metadataService.getTokenMetadata(mint);
  }

  async getBondingCurve(mint: string) {
    return bondingCurveService.getBondingCurve(mint);
  }

  async getTokenPrice(mint: string) {
    return pricingService.getTokenPrice(mint);
  }

  async simulateBuy(mint: string, solAmount: number) {
    return bondingCurveService.simulateBuy(mint, solAmount);
  }

  async simulateSell(mint: string, tokenAmount: number) {
    return bondingCurveService.simulateSell(mint, tokenAmount);
  }

  async listTokens(params: {
    limit: number;
    offset: number;
    sort: string;
    order: string;
    category: string;
  }) {
    try {
      // Use blockchain-based discovery
      console.log('Fetching tokens from blockchain...');
      const tokensWithDetails = await tokenDiscoveryService.getTokensWithDetails(params.limit + params.offset);

      // Fetch metadata for all discovered tokens in parallel
      console.log(`Fetching metadata for ${tokensWithDetails.length} tokens...`);
      const mints = tokensWithDetails.map((t: any) => t.mint);
      const metadataMap = await metadataService.getTokenMetadataBatch(mints);

      // Transform blockchain data to API response format
      const transformedTokens = tokensWithDetails
        .map((token: any) => {
          const marketCap = token.marketCap || 0;
          const metadata = metadataMap.get(token.mint);

          // Calculate quality score based on bonding curve progress and metadata
          const baseScore = Math.min(100, Math.floor(
            token.progress * 0.4 + // Progress weight (40%)
            Math.min(30, token.solRaised * 0.3) + // SOL raised weight
            20 // Base score
          ));

          // Boost quality score if metadata has social links
          const qualityScore = metadata?.qualityScore || baseScore;

          return {
            mint: token.mint,
            name: metadata?.name || 'Unknown',
            symbol: metadata?.symbol || 'PUMP',
            description: metadata?.description || '',
            image_uri: metadata?.image || '',
            metadata_uri: metadata?.uri || '',
            twitter: metadata?.socialLinks?.twitter || null,
            telegram: metadata?.socialLinks?.telegram || null,
            website: metadata?.socialLinks?.website || null,
            creator: metadata?.creator || token.creator || 'unknown',
            created_timestamp: token.created_timestamp,
            last_trade_timestamp: token.created_timestamp,
            price_sol: token.currentPrice,
            market_cap_sol: marketCap,
            sol_raised: token.solRaised,
            sol_remaining: token.solRemaining,
            quality_score: qualityScore,
            category: token.category,
            progress: token.progress,
            complete: token.complete || false,
          };
        })
        .filter((token: any) => {
          // Filter by category if not 'all'
          if (params.category === 'all') return true;
          return token.category === params.category;
        });

      // Apply offset and limit
      const paginatedTokens = transformedTokens.slice(params.offset, params.offset + params.limit);

      // Sort tokens
      if (params.sort === 'market_cap') {
        paginatedTokens.sort((a: any, b: any) =>
          params.order === 'DESC' ? b.market_cap_sol - a.market_cap_sol : a.market_cap_sol - b.market_cap_sol
        );
      } else if (params.sort === 'created_timestamp') {
        paginatedTokens.sort((a: any, b: any) =>
          params.order === 'DESC' ? b.created_timestamp - a.created_timestamp : a.created_timestamp - b.created_timestamp
        );
      }

      return paginatedTokens;
    } catch (error) {
      console.error('Error fetching tokens list:', error);
      return [];
    }
  }
}

export const tokenService = new TokenService();
