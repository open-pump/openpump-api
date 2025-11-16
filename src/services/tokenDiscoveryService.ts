import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { config } from '../config';
import { cache, CacheKeys } from '../utils/cache';
import { bondingCurveService } from './bondingCurveService';

const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

interface DiscoveredToken {
  mint: string;
  creator: string;
  created_timestamp: number;
  signature: string;
}

export class TokenDiscoveryService {
  private connection: Connection;
  private pumpProgramId: PublicKey;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.pumpProgramId = new PublicKey(PUMP_PROGRAM_ID);
  }

  async discoverRecentTokens(limit: number = 50): Promise<DiscoveredToken[]> {
    try {
      // Check cache first
      const cacheKey = 'discovered_tokens';
      const cached = await cache.get<DiscoveredToken[]>(cacheKey);
      if (cached && cached.length > 0) {
        return cached.slice(0, limit);
      }

      console.log('Fetching recent Pump.fun program signatures...');

      // Get recent signatures for the Pump.fun program
      const signatures = await this.connection.getSignaturesForAddress(
        this.pumpProgramId,
        { limit: 100 }
      );

      console.log(`Found ${signatures.length} recent signatures`);

      const discoveredTokens: DiscoveredToken[] = [];
      const seenMints = new Set<string>();

      // Parse transactions to find token creations
      for (const sig of signatures.slice(0, 50)) {
        try {
          const tx = await this.connection.getParsedTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx) continue;

          // Look for token creation patterns
          const tokenMint = this.extractTokenMintFromTransaction(tx);

          if (tokenMint && !seenMints.has(tokenMint)) {
            seenMints.add(tokenMint);
            discoveredTokens.push({
              mint: tokenMint,
              creator: tx.transaction.message.accountKeys[0]?.pubkey?.toString() || 'unknown',
              created_timestamp: sig.blockTime || Math.floor(Date.now() / 1000),
              signature: sig.signature,
            });
          }

          if (discoveredTokens.length >= limit) break;
        } catch (err) {
          // Skip failed transaction parsing
          continue;
        }
      }

      // Cache for 60 seconds
      if (discoveredTokens.length > 0) {
        await cache.set(cacheKey, discoveredTokens, 60);
      }

      console.log(`Discovered ${discoveredTokens.length} tokens from blockchain`);
      return discoveredTokens;
    } catch (error) {
      console.error('Error discovering tokens:', error);
      return [];
    }
  }

  private extractTokenMintFromTransaction(tx: ParsedTransactionWithMeta): string | null {
    // Look for InitializeMint instructions or bonding curve creation
    const instructions = tx.transaction.message.instructions;

    for (const ix of instructions) {
      // Check if this is a Pump.fun instruction
      if ('programId' in ix && ix.programId.toString() === PUMP_PROGRAM_ID) {
        // Check post token balances for new mints
        if (tx.meta?.postTokenBalances && tx.meta.postTokenBalances.length > 0) {
          const tokenBalance = tx.meta.postTokenBalances[0];
          if (tokenBalance.mint) {
            return tokenBalance.mint;
          }
        }
      }
    }

    // Also check account keys for potential mints
    const accountKeys = tx.transaction.message.accountKeys;
    for (const account of accountKeys) {
      const pubkey = account.pubkey.toString();
      // Token mints are typically new accounts in the transaction
      if (pubkey !== PUMP_PROGRAM_ID && pubkey.length === 44) {
        // Check if this could be a token mint by verifying it has bonding curve
        // This is a heuristic - we'll validate later
        return pubkey;
      }
    }

    return null;
  }

  async getTokensWithDetails(limit: number = 50): Promise<any[]> {
    const discoveredTokens = await this.discoverRecentTokens(limit * 2);
    const tokensWithDetails: any[] = [];

    for (const token of discoveredTokens) {
      try {
        // Get bonding curve data to verify it's a real Pump.fun token
        const bondingCurve = await bondingCurveService.getBondingCurve(token.mint);

        if (bondingCurve) {
          tokensWithDetails.push({
            mint: token.mint,
            creator: token.creator,
            created_timestamp: token.created_timestamp,
            signature: token.signature,
            ...bondingCurve,
          });

          if (tokensWithDetails.length >= limit) break;
        }
      } catch (err) {
        // Skip tokens that don't have valid bonding curves
        continue;
      }
    }

    return tokensWithDetails;
  }
}

export const tokenDiscoveryService = new TokenDiscoveryService();
