import { Connection, PublicKey } from '@solana/web3.js';
import { Idl, BorshAccountsCoder } from '@coral-xyz/anchor';
import { config } from '../config';
import { BondingCurve, TokenCategory } from '../types';
import { cache, CacheKeys } from '../utils/cache';
import PUMP_BONDING_CURVE_IDL from './pump-bonding-curve-idl.json';

const PUMP_PROGRAM_ID = '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
const GRADUATION_THRESHOLD_SOL = 85;
const LAMPORTS_PER_SOL = 1_000_000_000;

export class BondingCurveService {
  private connection: Connection;
  private accountsCoder: BorshAccountsCoder;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.accountsCoder = new BorshAccountsCoder(PUMP_BONDING_CURVE_IDL as Idl);
  }

  async getBondingCurve(mint: string): Promise<BondingCurve | null> {
    // Try cache first
    const cached = await cache.get<BondingCurve>(CacheKeys.bondingCurve(mint));
    if (cached) {
      return cached;
    }

    try {
      const mintPubkey = new PublicKey(mint);

      // Derive bonding curve PDA
      const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('bonding-curve'), mintPubkey.toBuffer()],
        new PublicKey(PUMP_PROGRAM_ID)
      );

      // Fetch account data
      const accountInfo = await this.connection.getAccountInfo(bondingCurvePDA);

      if (!accountInfo) {
        // Token exists but no bonding curve = pre-bonded or graduated
        return null;
      }

      // Decode using Anchor IDL
      const rawData = this.decodeBondingCurve(accountInfo.data);

      if (!rawData) {
        return null;
      }

      // Parse bonding curve data - handle both camelCase and snake_case
      const virtualTokenReserves = BigInt(
        (rawData.virtualTokenReserves || rawData.virtual_token_reserves)?.toString() || '0'
      );
      const virtualSolReserves = BigInt(
        (rawData.virtualSolReserves || rawData.virtual_sol_reserves)?.toString() || '0'
      );
      const realTokenReserves = BigInt(
        (rawData.realTokenReserves || rawData.real_token_reserves)?.toString() || '0'
      );
      const realSolReserves = BigInt(
        (rawData.realSolReserves || rawData.real_sol_reserves)?.toString() || '0'
      );
      const tokenTotalSupply = BigInt(
        (rawData.tokenTotalSupply || rawData.token_total_supply)?.toString() || '1000000000000000'
      );
      const complete = rawData.complete || false;

      // Calculate SOL raised
      const solRaised = Number(realSolReserves) / LAMPORTS_PER_SOL;

      // Calculate progress percentage
      const progress = Math.min(100, (solRaised / GRADUATION_THRESHOLD_SOL) * 100);

      // Calculate remaining SOL
      const solRemaining = Math.max(0, GRADUATION_THRESHOLD_SOL - solRaised);

      // Calculate current price (Price = virtualSolReserves / virtualTokenReserves)
      const currentPrice = Number(virtualSolReserves) / Number(virtualTokenReserves);

      // Calculate market cap (circulating supply * current price)
      const circulatingSupply = Number(tokenTotalSupply - realTokenReserves);
      const marketCap = (circulatingSupply * currentPrice) / LAMPORTS_PER_SOL;

      // Determine category based on progress
      let category: TokenCategory = 'unknown';
      if (complete || progress >= 100) {
        category = 'graduated';
      } else if (progress >= 70) {
        category = 'final_stretch'; // Close to graduation (70-100%)
      } else if (progress >= 20) {
        category = 'rising'; // Gaining momentum (20-70%)
      } else if (progress > 0) {
        category = 'new'; // Just launched (0-20%)
      }

      const bondingCurve: BondingCurve = {
        mint,
        bondingCurve: bondingCurvePDA.toBase58(),
        progress: Math.round(progress * 100) / 100,
        solRaised,
        solRemaining,
        virtualSolReserves: Number(virtualSolReserves) / LAMPORTS_PER_SOL,
        virtualTokenReserves: Number(virtualTokenReserves) / 1e6,
        realSolReserves: Number(realSolReserves) / LAMPORTS_PER_SOL,
        realTokenReserves: Number(realTokenReserves) / 1e6,
        currentPrice,
        marketCap,
        category,
        complete,
        createdAt: new Date().toISOString(),
      };

      // Cache for configured TTL
      await cache.set(
        CacheKeys.bondingCurve(mint),
        bondingCurve,
        config.cache.ttl.bondingCurve
      );

      return bondingCurve;
    } catch (error) {
      console.error(`Error fetching bonding curve for ${mint}:`, error);
      return null;
    }
  }

  private decodeBondingCurve(data: Buffer): any {
    try {
      // Anchor decoder expects full data including discriminator
      return this.accountsCoder.decode('BondingCurve', data);
    } catch (error) {
      // Silently return null for non-bonding-curve accounts
      // This is expected when parsing transaction accounts
      return null;
    }
  }

  async simulateBuy(mint: string, solAmount: number): Promise<{
    tokensOut: number;
    priceImpact: number;
    newPrice: number;
  } | null> {
    const bonding = await this.getBondingCurve(mint);
    if (!bonding) return null;

    const virtualSolReserves = BigInt(Math.floor(bonding.virtualSolReserves * LAMPORTS_PER_SOL));
    const virtualTokenReserves = BigInt(Math.floor(bonding.virtualTokenReserves * 1e6));
    const solAmountLamports = BigInt(Math.floor(solAmount * LAMPORTS_PER_SOL));

    // Constant product: k = virtualSol * virtualToken
    const k = virtualSolReserves * virtualTokenReserves;

    // New reserves after buy
    const newSolReserves = virtualSolReserves + solAmountLamports;
    const newTokenReserves = k / newSolReserves;

    // Tokens out
    const tokensOut = Number(virtualTokenReserves - newTokenReserves) / 1e6;

    // New price
    const newPrice = Number(newSolReserves) / Number(newTokenReserves);

    // Price impact
    const oldPrice = bonding.currentPrice;
    const priceImpact = ((newPrice - oldPrice) / oldPrice) * 100;

    return {
      tokensOut,
      priceImpact,
      newPrice,
    };
  }

  async simulateSell(mint: string, tokenAmount: number): Promise<{
    solOut: number;
    priceImpact: number;
    newPrice: number;
  } | null> {
    const bonding = await this.getBondingCurve(mint);
    if (!bonding) return null;

    const virtualSolReserves = BigInt(Math.floor(bonding.virtualSolReserves * LAMPORTS_PER_SOL));
    const virtualTokenReserves = BigInt(Math.floor(bonding.virtualTokenReserves * 1e6));
    const tokenAmountRaw = BigInt(Math.floor(tokenAmount * 1e6));

    // Constant product formula
    const k = virtualSolReserves * virtualTokenReserves;

    // New reserves after sell
    const newTokenReserves = virtualTokenReserves + tokenAmountRaw;
    const newSolReserves = k / newTokenReserves;

    // SOL out
    const solOut = Number(virtualSolReserves - newSolReserves) / LAMPORTS_PER_SOL;

    // New price
    const newPrice = Number(newSolReserves) / Number(newTokenReserves);

    // Price impact
    const oldPrice = bonding.currentPrice;
    const priceImpact = ((newPrice - oldPrice) / oldPrice) * 100;

    return {
      solOut,
      priceImpact,
      newPrice,
    };
  }
}

export const bondingCurveService = new BondingCurveService();
