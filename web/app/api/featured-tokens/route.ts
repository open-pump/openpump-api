import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch real tokens from Pump.fun API
    const response = await fetch('https://frontend-api.pump.fun/coins?offset=0&limit=50&sort=last_trade_timestamp&order=DESC&includeNsfw=false');

    if (!response.ok) {
      throw new Error('Failed to fetch from Pump.fun API');
    }

    const data = await response.json();

    // Transform and select top 3 tokens
    const tokens = data.slice(0, 3).map((coin: any) => {
      // Calculate quality score based on market cap and volume
      const marketCap = coin.usd_market_cap || 0;
      const qualityScore = Math.min(100, Math.floor(
        (marketCap / 10000) * 20 + // Market cap weight
        (coin.reply_count || 0) / 2 + // Social engagement
        30 // Base score
      ));

      // Determine category based on market cap
      let category = 'New';
      if (marketCap > 500000) category = 'Graduated';
      else if (marketCap > 100000) category = 'Final Stretch';
      else if (marketCap > 50000) category = 'Rising';

      return {
        mint: coin.mint,
        name: coin.name,
        symbol: coin.symbol,
        creator: coin.creator?.substring(0, 8) + '...',
        quality_score: qualityScore,
        category,
        change_24h: null, // Pump.fun doesn't provide 24h change in this endpoint
        price_usd: parseFloat(coin.price || 0),
        market_cap: marketCap,
        progress: Math.min(100, (marketCap / 500000) * 100), // Assume 500k is graduation
      };
    });

    return NextResponse.json({
      success: true,
      data: tokens,
      meta: {
        timestamp: new Date().toISOString(),
        count: tokens.length,
      },
    });
  } catch (error) {
    console.error('Error fetching featured tokens:', error);

    // Fallback to static data if API fails
    const fallbackTokens = [
      {
        mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC',
        name: 'Help',
        symbol: 'HELP',
        creator: 'Creator...',
        quality_score: 95,
        category: 'Graduated',
        change_24h: null,
        price_usd: 0.00123,
        market_cap: 450000,
        progress: 90,
      },
      {
        mint: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv',
        name: 'Pepe',
        symbol: 'PEPE',
        creator: 'Creator...',
        quality_score: 88,
        category: 'Final Stretch',
        change_24h: null,
        price_usd: 0.00045,
        market_cap: 280000,
        progress: 56,
      },
      {
        mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        name: 'Bonk',
        symbol: 'BONK',
        creator: 'Creator...',
        quality_score: 92,
        category: 'Rising',
        change_24h: null,
        price_usd: 0.00089,
        market_cap: 350000,
        progress: 70,
      },
    ];

    return NextResponse.json({
      success: true,
      data: fallbackTokens,
      meta: {
        timestamp: new Date().toISOString(),
        count: fallbackTokens.length,
        fallback: true,
      },
    });
  }
}
