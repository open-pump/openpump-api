import { Connection, PublicKey, Logs } from '@solana/web3.js';
import { EventEmitter } from 'events';
import { config } from '../config';
import { bondingCurveService } from './bondingCurveService';
import { metadataService } from './metadataService';

const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';

export interface NewTokenEvent {
  type: 'new_token';
  timestamp: number;
  mint: string;
  signature: string;
  creator?: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  bondingCurve?: {
    progress: number;
    solRaised: number;
    currentPrice: number;
    marketCap: number;
  };
}

export interface TradeEvent {
  type: 'buy' | 'sell';
  timestamp: number;
  mint: string;
  signature: string;
  trader: string;
  solAmount: number;
  tokenAmount: number;
}

export class RealtimeTokenService extends EventEmitter {
  private connection: Connection;
  private subscriptionId: number | null = null;
  private isRunning: boolean = false;
  private processedSignatures: Set<string> = new Set();
  private seenMints: Set<string> = new Set(); // Track already-seen mints to avoid duplicates
  private maxSignatureCache: number = 10000;

  constructor() {
    super();
    // Use WebSocket URL for subscriptions
    const rpcUrl = config.solana.rpcUrl;
    const wsUrl = rpcUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    this.connection = new Connection(rpcUrl, {
      wsEndpoint: wsUrl,
      commitment: 'confirmed',
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Realtime token service already running');
      return;
    }

    console.log('Starting realtime token launch detection...');
    console.log(`Subscribing to Pump.fun program: ${PUMP_PROGRAM_ID}`);

    try {
      // Subscribe to program logs
      this.subscriptionId = this.connection.onLogs(
        new PublicKey(PUMP_PROGRAM_ID),
        async (logs: Logs) => {
          await this.handleLogs(logs);
        },
        'confirmed'
      );

      this.isRunning = true;
      console.log(`Subscribed with ID: ${this.subscriptionId}`);
      this.emit('started');
    } catch (error) {
      console.error('Failed to start realtime service:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning || this.subscriptionId === null) {
      console.log('Realtime token service not running');
      return;
    }

    console.log('Stopping realtime token service...');
    await this.connection.removeOnLogsListener(this.subscriptionId);
    this.subscriptionId = null;
    this.isRunning = false;
    this.emit('stopped');
    console.log('Realtime token service stopped');
  }

  private async handleLogs(logs: Logs): Promise<void> {
    // Skip if already processed
    if (this.processedSignatures.has(logs.signature)) {
      return;
    }

    // Add to processed set
    this.processedSignatures.add(logs.signature);

    // Clean up old signatures to prevent memory leak
    if (this.processedSignatures.size > this.maxSignatureCache) {
      const toDelete = Array.from(this.processedSignatures).slice(0, 1000);
      toDelete.forEach((sig) => this.processedSignatures.delete(sig));
    }

    // Check for errors
    if (logs.err) {
      return; // Skip failed transactions
    }

    // Parse logs to detect token creation
    const isTokenCreation = this.isTokenCreationLog(logs.logs);
    const isBuyTrade = this.isBuyLog(logs.logs);
    const isSellTrade = this.isSellLog(logs.logs);

    if (isTokenCreation) {
      await this.handleTokenCreation(logs);
    } else if (isBuyTrade || isSellTrade) {
      await this.handleTrade(logs, isBuyTrade ? 'buy' : 'sell');
    }
  }

  private isTokenCreationLog(logs: string[]): boolean {
    // Look for "create" instruction in Pump.fun logs
    // Common patterns: "Program log: Instruction: Create" or similar
    return logs.some(
      (log) =>
        log.includes('Instruction: Create') ||
        log.includes('Program log: create') ||
        (log.includes('InitializeMint') && logs.some((l) => l.includes(PUMP_PROGRAM_ID)))
    );
  }

  private isBuyLog(logs: string[]): boolean {
    return logs.some((log) => log.includes('Instruction: Buy') || log.includes('Program log: buy'));
  }

  private isSellLog(logs: string[]): boolean {
    return logs.some((log) => log.includes('Instruction: Sell') || log.includes('Program log: sell'));
  }

  private async handleTokenCreation(logs: Logs): Promise<void> {
    console.log(`New token creation detected! Signature: ${logs.signature}`);

    try {
      // Fetch the transaction to get token details
      const tx = await this.connection.getParsedTransaction(logs.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) {
        console.log('Could not fetch transaction details');
        return;
      }

      // Extract token mint from transaction
      const tokenMint = this.extractMintFromTransaction(tx);

      if (!tokenMint) {
        console.log('Could not extract token mint from transaction');
        return;
      }

      // Skip if we've already seen this mint (prevents duplicates)
      if (this.seenMints.has(tokenMint)) {
        console.log(`Skipping duplicate mint: ${tokenMint}`);
        return;
      }

      // Add to seen mints
      this.seenMints.add(tokenMint);

      // Clean up old mints to prevent memory leak
      if (this.seenMints.size > this.maxSignatureCache) {
        const toDelete = Array.from(this.seenMints).slice(0, 1000);
        toDelete.forEach((mint) => this.seenMints.delete(mint));
      }

      console.log(`New token mint: ${tokenMint}`);

      // Emit basic event immediately for speed
      const quickEvent: NewTokenEvent = {
        type: 'new_token',
        timestamp: Date.now(),
        mint: tokenMint,
        signature: logs.signature,
        creator: tx.transaction.message.accountKeys[0]?.pubkey?.toString(),
      };

      this.emit('new_token', quickEvent);

      // Fetch additional details asynchronously (don't block the stream)
      this.enrichTokenData(quickEvent).catch((err) => {
        console.error('Error enriching token data:', err);
      });
    } catch (error) {
      console.error('Error handling token creation:', error);
    }
  }

  private async enrichTokenData(event: NewTokenEvent): Promise<void> {
    try {
      // Fetch bonding curve and metadata in parallel
      const [bondingCurve, metadata] = await Promise.all([
        bondingCurveService.getBondingCurve(event.mint).catch(() => null),
        metadataService.getTokenMetadata(event.mint).catch(() => null),
      ]);

      if (bondingCurve || metadata) {
        const enrichedEvent: NewTokenEvent = {
          ...event,
          name: metadata?.name,
          symbol: metadata?.symbol,
          description: metadata?.description,
          image: metadata?.image,
          bondingCurve: bondingCurve
            ? {
                progress: bondingCurve.progress,
                solRaised: bondingCurve.solRaised,
                currentPrice: bondingCurve.currentPrice,
                marketCap: bondingCurve.marketCap,
              }
            : undefined,
        };

        this.emit('token_enriched', enrichedEvent);
      }
    } catch (error) {
      console.error('Error enriching token data:', error);
    }
  }

  private async handleTrade(logs: Logs, type: 'buy' | 'sell'): Promise<void> {
    // For trading bots, trades are also important
    // This is optional but useful for monitoring specific tokens
    try {
      const tx = await this.connection.getParsedTransaction(logs.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx) return;

      const tokenMint = this.extractMintFromTransaction(tx);
      if (!tokenMint) return;

      const tradeEvent: TradeEvent = {
        type,
        timestamp: Date.now(),
        mint: tokenMint,
        signature: logs.signature,
        trader: tx.transaction.message.accountKeys[0]?.pubkey?.toString() || 'unknown',
        solAmount: 0, // Would need to parse instruction data
        tokenAmount: 0, // Would need to parse instruction data
      };

      this.emit('trade', tradeEvent);
    } catch (error) {
      // Silently skip trade parsing errors
    }
  }

  private extractMintFromTransaction(tx: any): string | null {
    // Check post token balances for the mint
    if (tx.meta?.postTokenBalances && tx.meta.postTokenBalances.length > 0) {
      const tokenBalance = tx.meta.postTokenBalances[0];
      if (tokenBalance.mint) {
        return tokenBalance.mint;
      }
    }

    // Fallback: look through account keys
    const accountKeys = tx.transaction.message.accountKeys;
    for (const account of accountKeys) {
      const pubkey = account.pubkey.toString();
      // Skip known program IDs and system accounts
      if (
        pubkey !== PUMP_PROGRAM_ID &&
        !pubkey.startsWith('11111111') &&
        !pubkey.startsWith('Token') &&
        pubkey.length >= 32 &&
        pubkey.length <= 44
      ) {
        // This is a heuristic - might need refinement
        return pubkey;
      }
    }

    return null;
  }

  getStatus(): { running: boolean; subscriptionId: number | null; processedCount: number } {
    return {
      running: this.isRunning,
      subscriptionId: this.subscriptionId,
      processedCount: this.processedSignatures.size,
    };
  }
}

export const realtimeTokenService = new RealtimeTokenService();
