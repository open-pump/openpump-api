import { heliusClient } from './heliusClient';
import { ipfsClient } from './ipfsClient';
import { cache, CacheKeys } from '../utils/cache';
import { config } from '../config';
import { TokenMetadata } from '../types';

export class MetadataService {
  async getTokenMetadata(mint: string): Promise<TokenMetadata | null> {
    // Try cache first
    const cached = await cache.get<TokenMetadata>(CacheKeys.tokenMetadata(mint));
    if (cached) {
      return cached;
    }

    try {
      // Get on-chain metadata from Helius DAS
      const onChainMetadata = await heliusClient.getTokenMetadata(mint);

      if (!onChainMetadata) {
        return null;
      }

      // Fetch IPFS metadata if URI exists
      let ipfsMetadata = null;
      if (onChainMetadata.uri) {
        ipfsMetadata = await ipfsClient.fetchMetadata(onChainMetadata.uri);
      }

      // Extract social links
      const socialLinks = ipfsMetadata
        ? ipfsClient.extractSocialLinks(ipfsMetadata)
        : {};

      // Calculate quality score
      const qualityScore = ipfsClient.calculateQualityScore(
        onChainMetadata,
        ipfsMetadata,
        socialLinks
      );

      // Combine all metadata
      const metadata: TokenMetadata = {
        mint,
        name: onChainMetadata.name || ipfsMetadata?.name || 'Unknown',
        symbol: onChainMetadata.symbol || ipfsMetadata?.symbol || 'UNKNOWN',
        description: onChainMetadata.description || ipfsMetadata?.description,
        image: onChainMetadata.image || ipfsMetadata?.image,
        decimals: 6, // Pump.fun tokens are always 6 decimals
        supply: '1000000000', // Pump.fun tokens are always 1B supply
        creator: onChainMetadata.creator,
        uri: onChainMetadata.uri,
        qualityScore,
        socialLinks,
        hasSocial: Object.keys(socialLinks).length > 0,
      };

      // Cache for 5 minutes
      await cache.set(
        CacheKeys.tokenMetadata(mint),
        metadata,
        config.cache.ttl.tokenMetadata
      );

      return metadata;
    } catch (error) {
      console.error(`Error fetching metadata for ${mint}:`, error);
      return null;
    }
  }

  async getTokenMetadataBatch(mints: string[]): Promise<Map<string, TokenMetadata>> {
    const results = new Map<string, TokenMetadata>();

    // Fetch in parallel (but limit concurrency to avoid rate limits)
    const BATCH_SIZE = 5;
    for (let i = 0; i < mints.length; i += BATCH_SIZE) {
      const batch = mints.slice(i, i + BATCH_SIZE);
      const promises = batch.map((mint) => this.getTokenMetadata(mint));
      const batchResults = await Promise.all(promises);

      batchResults.forEach((metadata, index) => {
        if (metadata) {
          results.set(batch[index], metadata);
        }
      });
    }

    return results;
  }
}

export const metadataService = new MetadataService();
