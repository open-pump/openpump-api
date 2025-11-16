import { bondingCurveService } from './bondingCurveService';
import { cache, CacheKeys } from '../utils/cache';
import { config } from '../config';
import { TokenPrice } from '../types';

interface GeckoTerminalPool {
  attributes: {
    base_token_price_usd: string;
    quote_token_price_usd: string;
    base_token_price_native_currency: string;
    reserve_in_usd: string;
    volume_usd: {
      h24: string;
    };
    price_change_percentage: {
      h24: string;
    };
    fdv_usd: string;
  };
}

export class PricingService {
  private geckoTerminalBaseUrl = 'https://api.geckoterminal.com/api/v2';

  async getTokenPrice(mint: string): Promise<TokenPrice | null> {
    // Try cache first
    const cached = await cache.get<TokenPrice>(CacheKeys.tokenPrice(mint));
    if (cached) {
      return cached;
    }

    // ALWAYS try bonding curve first (most accurate, direct from blockchain)
    const bondingCurve = await bondingCurveService.getBondingCurve(mint);

    if (bondingCurve) {
      // Token has bonding curve - this is the MOST ACCURATE price source
      const price = await this.getPriceFromBondingCurve(
        mint,
        bondingCurve.currentPrice,
        bondingCurve.marketCap,
        bondingCurve.solRaised
      );
      if (price) {
        await cache.set(CacheKeys.tokenPrice(mint), price, config.cache.ttl.tokenPrice);
        return price;
      }
    }

    // Only use GeckoTerminal for graduated tokens (no bonding curve)
    const geckoPrice = await this.getPriceFromGeckoTerminal(mint);
    if (geckoPrice) {
      await cache.set(CacheKeys.tokenPrice(mint), geckoPrice, config.cache.ttl.tokenPrice);
      return geckoPrice;
    }

    return null;
  }

  private async getPriceFromBondingCurve(
    mint: string,
    priceInSol: number,
    marketCapInSol: number,
    liquidityInSol: number
  ): Promise<TokenPrice | null> {
    try {
      // Get SOL price in USD
      const solPriceUsd = await this.getSolPrice();

      const priceUsd = priceInSol * solPriceUsd;
      const marketCapUsd = marketCapInSol * solPriceUsd;
      const liquidityUsd = liquidityInSol * solPriceUsd;

      return {
        mint,
        priceUsd,
        priceSol: priceInSol,
        marketCapUsd,
        liquidityUsd,
        source: 'bonding-curve',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting price from bonding curve:', error);
      return null;
    }
  }

  private async getPriceFromGeckoTerminal(mint: string): Promise<TokenPrice | null> {
    try {
      // Search for token pools on Solana
      const url = `${this.geckoTerminalBaseUrl}/networks/solana/tokens/${mint}/pools`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        return null;
      }

      // Get the pool with highest liquidity
      const pool: GeckoTerminalPool = data.data[0];

      const priceUsd = parseFloat(pool.attributes.base_token_price_usd);
      const priceSol = parseFloat(pool.attributes.base_token_price_native_currency);
      const liquidityUsd = parseFloat(pool.attributes.reserve_in_usd);
      const volume24h = parseFloat(pool.attributes.volume_usd.h24);
      const priceChange24h = parseFloat(pool.attributes.price_change_percentage.h24);
      const marketCapUsd = parseFloat(pool.attributes.fdv_usd);

      return {
        mint,
        priceUsd,
        priceSol,
        marketCapUsd,
        liquidityUsd,
        volume24h,
        priceChange24h,
        source: 'geckoterminal',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching from GeckoTerminal:', error);
      return null;
    }
  }

  private async getSolPrice(): Promise<number> {
    try {
      // Try cache first
      const cached = await cache.get<number>('sol:price:usd');
      if (cached) {
        return cached;
      }

      // Fetch from GeckoTerminal
      const url = `${this.geckoTerminalBaseUrl}/simple/networks/solana/token_price/So11111111111111111111111111111111111111112`;

      const response = await fetch(url);

      if (!response.ok) {
        // Fallback to hardcoded value if API fails
        return 100; // Approximate SOL price
      }

      const data = await response.json();
      const price = parseFloat(data.data.attributes.token_prices.So11111111111111111111111111111111111111112);

      // Cache for 1 minute
      await cache.set('sol:price:usd', price, 60);

      return price;
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      return 100; // Fallback
    }
  }
}

export const pricingService = new PricingService();
