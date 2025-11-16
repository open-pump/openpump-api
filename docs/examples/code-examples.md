# Code Examples

Ready-to-use code snippets for common OpenPump API tasks.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Token Analysis](#token-analysis)
- [Price Tracking](#price-tracking)
- [Trading](#trading)
- [Advanced Patterns](#advanced-patterns)

---

## Basic Usage

### Fetch Token Data

```typescript
const OPENPUMP_API_KEY = process.env.OPENPUMP_API_KEY;

async function getToken(mint: string) {
  const response = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}`,
    {
      headers: {
        'Authorization': `Bearer ${OPENPUMP_API_KEY}`,
      },
    }
  );

  const result = await response.json();
  return result.data;
}

// Usage
const token = await getToken('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump');
console.log(token);
```

### Get Quality Score Only

```typescript
async function getQualityScore(mint: string) {
  const response = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}/metadata`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
      },
    }
  );

  const result = await response.json();
  return result.data.qualityScore;
}

const score = await getQualityScore('MINT_ADDRESS');
console.log(`Quality Score: ${score}/100`);
```

---

## Token Analysis

### Filter High-Quality Tokens

```typescript
async function findHighQualityTokens(mints: string[], minScore: number = 70) {
  const highQuality = [];

  for (const mint of mints) {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}/metadata`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    const { data } = await response.json();

    if (data.qualityScore >= minScore && data.hasSocial) {
      highQuality.push({
        mint,
        name: data.name,
        symbol: data.symbol,
        score: data.qualityScore,
        twitter: data.socialLinks.twitter,
      });
    }
  }

  return highQuality.sort((a, b) => b.score - a.score);
}

// Usage
const tokens = await findHighQualityTokens([...mints], 80);
console.log('High quality tokens:', tokens);
```

### Find Final Stretch Tokens

```typescript
async function findFinalStretchTokens(mints: string[]) {
  const finalStretch = [];

  for (const mint of mints) {
    try {
      const response = await fetch(
        `https://api.openpump.io/v1/tokens/${mint}/bonding`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          },
        }
      );

      if (!response.ok) continue;

      const { data } = await response.json();

      if (data.category === 'final-stretch' && data.progress > 80) {
        finalStretch.push({
          mint,
          progress: data.progress,
          solRaised: data.solRaised,
          solRemaining: data.solRemaining,
          currentPrice: data.currentPrice,
        });
      }
    } catch (error) {
      continue;
    }
  }

  // Sort by progress (closest to graduation first)
  return finalStretch.sort((a, b) => b.progress - a.progress);
}

const tokens = await findFinalStretchTokens([...mints]);
tokens.forEach(t => {
  console.log(`${t.mint}: ${t.progress.toFixed(2)}% (${t.solRemaining.toFixed(2)} SOL remaining)`);
});
```

### Compare Tokens

```typescript
async function compareTokens(mint1: string, mint2: string) {
  const [token1, token2] = await Promise.all([
    fetch(`https://api.openpump.io/v1/tokens/${mint1}`, {
      headers: { 'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}` },
    }).then(r => r.json()),
    fetch(`https://api.openpump.io/v1/tokens/${mint2}`, {
      headers: { 'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}` },
    }).then(r => r.json()),
  ]);

  const comparison = {
    token1: {
      name: token1.data.metadata.name,
      qualityScore: token1.data.metadata.qualityScore,
      price: token1.data.price?.usdPrice,
      marketCap: token1.data.price?.marketCap,
      category: token1.data.category,
    },
    token2: {
      name: token2.data.metadata.name,
      qualityScore: token2.data.metadata.qualityScore,
      price: token2.data.price?.usdPrice,
      marketCap: token2.data.price?.marketCap,
      category: token2.data.category,
    },
  };

  console.table(comparison);
  return comparison;
}
```

---

## Price Tracking

### Real-Time Price Monitor

```typescript
async function monitorPrice(mint: string, callback: (price: number) => void) {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(
        `https://api.openpump.io/v1/tokens/${mint}/price`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          },
        }
      );

      const { data } = await response.json();
      callback(data.usdPrice);
    } catch (error) {
      console.error('Price fetch error:', error);
    }
  }, 10000); // Every 10 seconds

  return () => clearInterval(interval);
}

// Usage
const stopMonitoring = await monitorPrice('MINT_ADDRESS', (price) => {
  console.log(`Current price: $${price.toFixed(8)}`);
});

// Stop after 5 minutes
setTimeout(stopMonitoring, 300000);
```

### Price Alert System

```typescript
class PriceAlert {
  private monitoring = new Map<string, NodeJS.Timer>();

  async create(
    mint: string,
    targetPrice: number,
    direction: 'above' | 'below',
    callback: (price: number) => void
  ) {
    const check = async () => {
      const response = await fetch(
        `https://api.openpump.io/v1/tokens/${mint}/price`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          },
        }
      );

      const { data } = await response.json();

      const triggered =
        direction === 'above'
          ? data.usdPrice >= targetPrice
          : data.usdPrice <= targetPrice;

      if (triggered) {
        callback(data.usdPrice);
        this.cancel(mint);
      }
    };

    const interval = setInterval(check, 10000);
    this.monitoring.set(mint, interval);
  }

  cancel(mint: string) {
    const interval = this.monitoring.get(mint);
    if (interval) {
      clearInterval(interval);
      this.monitoring.delete(mint);
    }
  }
}

// Usage
const alerts = new PriceAlert();

alerts.create('MINT', 0.00001, 'above', (price) => {
  console.log(`🚨 Price reached target: $${price}`);
});
```

### Portfolio Tracker

```typescript
interface Holding {
  mint: string;
  amount: number;
}

async function trackPortfolio(holdings: Holding[]) {
  let totalValue = 0;
  const positions = [];

  for (const { mint, amount } of holdings) {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    const { data } = await response.json();
    const value = data.price.usdPrice * amount;
    totalValue += value;

    positions.push({
      name: data.metadata.name,
      symbol: data.metadata.symbol,
      amount,
      price: data.price.usdPrice,
      value,
      change24h: data.price.priceChange24h,
    });
  }

  console.table(positions);
  console.log(`\nTotal Portfolio Value: $${totalValue.toFixed(2)}`);

  return { positions, totalValue };
}

// Usage
const portfolio = await trackPortfolio([
  { mint: 'MINT1', amount: 1000000 },
  { mint: 'MINT2', amount: 500000 },
]);
```

---

## Trading

### Pre-Trade Validation

```typescript
async function validateTrade(mint: string, solAmount: number) {
  // 1. Check token quality
  const metadataResp = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}/metadata`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
      },
    }
  );

  const metadata = (await metadataResp.json()).data;

  if (metadata.qualityScore < 70) {
    console.log('❌ Quality score too low');
    return false;
  }

  // 2. Simulate trade
  const simResp = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}/simulate-buy`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: solAmount }),
    }
  );

  const simulation = (await simResp.json()).data;

  // 3. Check price impact
  if (simulation.priceImpact > 5) {
    console.log(`❌ Price impact too high: ${simulation.priceImpact}%`);
    return false;
  }

  // 4. Check slippage
  if (simulation.slippage > 3) {
    console.log(`❌ Slippage too high: ${simulation.slippage}%`);
    return false;
  }

  console.log('✅ Trade validated');
  console.log(`Tokens out: ${simulation.tokensOut.toLocaleString()}`);
  console.log(`Price impact: ${simulation.priceImpact.toFixed(2)}%`);

  return true;
}

// Usage
const isValid = await validateTrade('MINT', 0.5);
if (isValid) {
  // Execute trade
}
```

### Optimal Position Sizing

```typescript
async function findOptimalSize(
  mint: string,
  maxPriceImpact: number = 3
): Promise<number> {
  let low = 0.01;
  let high = 10;
  let optimal = 0;

  while (high - low > 0.01) {
    const mid = (low + high) / 2;

    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}/simulate-buy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: mid }),
      }
    );

    const { data } = await response.json();

    if (data.priceImpact <= maxPriceImpact) {
      optimal = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return optimal;
}

// Usage
const maxSol = await findOptimalSize('MINT', 3);
console.log(`Optimal trade size: ${maxSol.toFixed(2)} SOL`);
```

### Stop Loss / Take Profit

```typescript
class PositionManager {
  private positions = new Map<string, any>();

  async open(mint: string, entryPrice: number, amount: number) {
    this.positions.set(mint, {
      entryPrice,
      amount,
      openedAt: Date.now(),
    });

    // Start monitoring
    this.monitor(mint);
  }

  private async monitor(mint: string) {
    const position = this.positions.get(mint);
    if (!position) return;

    const interval = setInterval(async () => {
      const response = await fetch(
        `https://api.openpump.io/v1/tokens/${mint}/price`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          },
        }
      );

      const { data } = await response.json();
      const currentPrice = data.usdPrice;

      const pnl = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      console.log(`${mint}: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%`);

      // Stop loss at -10%
      if (pnl <= -10) {
        console.log('🛑 Stop loss triggered');
        clearInterval(interval);
        this.close(mint);
      }

      // Take profit at +50%
      if (pnl >= 50) {
        console.log('💰 Take profit triggered');
        clearInterval(interval);
        this.close(mint);
      }
    }, 10000);
  }

  close(mint: string) {
    this.positions.delete(mint);
    console.log(`Position closed: ${mint}`);
  }
}

// Usage
const manager = new PositionManager();
manager.open('MINT', 0.00001, 0.5);
```

---

## Advanced Patterns

### Request Queue with Rate Limiting

```typescript
class RateLimitedQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute: number;

  constructor(requestsPerMinute: number) {
    this.requestsPerMinute = requestsPerMinute;
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.process();
      }
    });
  }

  private async process() {
    this.processing = true;
    const interval = 60000 / this.requestsPerMinute;

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await new Promise(r => setTimeout(r, interval));
      }
    }

    this.processing = false;
  }
}

// Usage (Pro tier: 300 req/min)
const queue = new RateLimitedQueue(300);

const results = await Promise.all(
  mints.map(mint =>
    queue.add(async () => {
      const response = await fetch(
        `https://api.openpump.io/v1/tokens/${mint}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          },
        }
      );
      return response.json();
    })
  )
);
```

### Caching Layer

```typescript
class CachedAPI {
  private cache = new Map<string, { data: any; expiry: number }>();

  async get(url: string, ttl: number = 30000) {
    const cached = this.cache.get(url);

    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
      },
    });

    const data = await response.json();

    this.cache.set(url, {
      data,
      expiry: Date.now() + ttl,
    });

    return data;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const api = new CachedAPI();

// First call hits API
const token1 = await api.get('https://api.openpump.io/v1/tokens/MINT');

// Second call within 30s uses cache
const token2 = await api.get('https://api.openpump.io/v1/tokens/MINT');
```

---

Need more examples? Check out:
- [Use Cases](./use-cases.md) - Real-world applications
- [Building a Bot](../guides/building-a-bot.md) - Complete trading bot

Have a specific use case? [Ask on Discord](https://discord.gg/openpump) →
