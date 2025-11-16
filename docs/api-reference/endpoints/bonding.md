# Bonding Curve Data

Get detailed bonding curve metrics for active pump.fun tokens.

## Endpoint

```
GET /v1/tokens/:address/bonding
```

## Description

Returns real-time bonding curve data for tokens still in the bonding phase. Returns null or 404 for graduated tokens.

**Use this when:** You need detailed bonding curve metrics like progress, reserves, and graduation estimates.

## Request

```bash
curl https://api.openpump.io/v1/tokens/ACTIVE_TOKEN_MINT/bonding \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Response (Active Bonding)

```json
{
  "success": true,
  "data": {
    "virtualSolReserves": 30000000000,
    "virtualTokenReserves": 1073000000000000,
    "realSolReserves": 45000000000,
    "realTokenReserves": 800000000000000,
    "tokenTotalSupply": 1000000000000000,
    "solRaised": 74.5,
    "solRemaining": 10.5,
    "progress": 87.6,
    "complete": false,
    "category": "final-stretch",
    "currentPrice": 0.00000123,
    "priceInUsd": 0.000123,
    "marketCap": 123000,
    "graduationEstimate": "~2 hours",
    "lastUpdated": "2025-11-14T10:30:00Z"
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Response (Graduated Token)

```json
{
  "success": false,
  "error": "Token has graduated to Raydium",
  "code": "GRADUATED",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `virtualSolReserves` | number | Virtual SOL reserves (lamports) |
| `virtualTokenReserves` | number | Virtual token reserves |
| `realSolReserves` | number | Real SOL reserves (lamports) |
| `realTokenReserves` | number | Real token reserves |
| `tokenTotalSupply` | number | Total token supply |
| `solRaised` | number | Total SOL raised |
| `solRemaining` | number | SOL remaining to graduation |
| `progress` | number | Progress to graduation (0-100%) |
| `complete` | boolean | Has reached 100% |
| `category` | string | Bonding phase category |
| `currentPrice` | number | Current price in SOL |
| `priceInUsd` | number | Current price in USD |
| `marketCap` | number | Market cap in USD |
| `graduationEstimate` | string | Estimated time to graduation |
| `lastUpdated` | string | ISO 8601 timestamp |

## Understanding Bonding Curves

### What is a Bonding Curve?

Pump.fun uses a bonding curve to determine token price based on supply and demand. As more SOL is deposited, the token price increases along the curve.

### Graduation Threshold

Tokens graduate to Raydium DEX when **85 SOL** is raised in the bonding curve.

### Progress Categories

| Category | Progress | Description |
|----------|----------|-------------|
| `new` | 0-70% | Early phase, plenty of runway |
| `final-stretch` | 70-99% | Close to graduation |
| `graduated` | 100% | Moved to Raydium |

### Virtual vs Real Reserves

- **Virtual Reserves**: Used for price calculation (includes initial liquidity)
- **Real Reserves**: Actual SOL and tokens in the curve

## Price Formula

The bonding curve uses a constant product formula:

```
virtualSolReserves × virtualTokenReserves = k (constant)

price = virtualSolReserves / virtualTokenReserves
```

## Code Examples

### Monitor Graduation Progress

```typescript
async function monitorGraduation(mint: string) {
  const check = async () => {
    try {
      const response = await fetch(
        `https://api.openpump.io/v1/tokens/${mint}/bonding`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          },
        }
      );

      if (response.status === 404) {
        console.log('✅ Token has graduated!');
        return true;
      }

      const { data } = await response.json();

      console.log(`Progress: ${data.progress.toFixed(2)}%`);
      console.log(`SOL Raised: ${data.solRaised.toFixed(2)} SOL`);
      console.log(`Remaining: ${data.solRemaining.toFixed(2)} SOL`);
      console.log(`Category: ${data.category}`);
      console.log(`Est. Graduation: ${data.graduationEstimate}`);
      console.log('---');

      return false;
    } catch (error) {
      console.error('Error checking bonding:', error);
      return false;
    }
  };

  // Check every 30 seconds
  const interval = setInterval(async () => {
    const graduated = await check();
    if (graduated) {
      clearInterval(interval);
    }
  }, 30000);

  // Initial check
  await check();
}

// Usage
monitorGraduation('ACTIVE_TOKEN_MINT');
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

      if (data.category === 'final-stretch') {
        finalStretch.push({
          mint,
          progress: data.progress,
          solRemaining: data.solRemaining,
          currentPrice: data.currentPrice,
        });
      }
    } catch (error) {
      continue;
    }
  }

  // Sort by proximity to graduation
  return finalStretch.sort((a, b) => b.progress - a.progress);
}

// Usage
const tokens = await findFinalStretchTokens([...mints]);
console.log('Tokens close to graduation:', tokens);
```

### Calculate Buy Impact

```typescript
async function calculateBuyImpact(mint: string, solAmount: number) {
  const response = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}/bonding`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
      },
    }
  );

  const { data } = await response.json();

  // Use constant product formula: x * y = k
  const k = data.virtualSolReserves * data.virtualTokenReserves;
  const newSolReserves = data.virtualSolReserves + (solAmount * 1e9); // Convert to lamports
  const newTokenReserves = k / newSolReserves;
  const tokensOut = data.virtualTokenReserves - newTokenReserves;

  const newPrice = newSolReserves / newTokenReserves;
  const priceImpact = ((newPrice - data.currentPrice) / data.currentPrice) * 100;

  return {
    tokensOut: tokensOut / 1e9, // Convert from lamports
    priceImpact,
    newPrice: newPrice / 1e9,
    currentPrice: data.currentPrice,
  };
}

// Usage
const impact = await calculateBuyImpact('MINT', 0.1);
console.log(`Buying 0.1 SOL:`);
console.log(`Tokens out: ${impact.tokensOut.toLocaleString()}`);
console.log(`Price impact: ${impact.priceImpact.toFixed(2)}%`);
```

## Graduation Tracking

### Real-Time Graduation Alerts

```typescript
async function watchForGraduation(mint: string, callback: () => void) {
  let lastProgress = 0;

  const interval = setInterval(async () => {
    try {
      const response = await fetch(
        `https://api.openpump.io/v1/tokens/${mint}/bonding`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
          },
        }
      );

      if (response.status === 404 || response.status === 400) {
        console.log('🎓 Token graduated!');
        callback();
        clearInterval(interval);
        return;
      }

      const { data } = await response.json();

      if (data.progress > lastProgress + 5) {
        console.log(`📈 Progress jump: ${lastProgress.toFixed(2)}% → ${data.progress.toFixed(2)}%`);
      }

      lastProgress = data.progress;

      if (data.progress >= 100) {
        console.log('🎓 Token at 100%, graduation imminent!');
        callback();
        clearInterval(interval);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }, 15000); // Check every 15 seconds
}

// Usage
watchForGraduation('MINT', () => {
  console.log('Token graduated! Consider selling or holding.');
});
```

## Performance

- **Uncached**: ~200ms (on-chain account read + parsing)
- **Cached**: ~15ms
- **Cache TTL**: 30 seconds

## Best Practices

### 1. Handle Graduation Gracefully

```typescript
async function getBondingOrFallback(mint: string) {
  try {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}/bonding`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    if (response.status === 404) {
      // Token graduated, fetch from DEX
      return await getDexPrice(mint);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching bonding data:', error);
    return null;
  }
}
```

### 2. Poll Appropriately

- **New tokens (0-70%)**: Poll every 1-5 minutes
- **Final stretch (70-99%)**: Poll every 15-30 seconds
- **Near 100% (95-99%)**: Poll every 5-10 seconds

### 3. Cache on Your End

Cache bonding data for 15-30 seconds to minimize API calls.

## Related Endpoints

- [Complete Token Data](./tokens.md) - Bonding + metadata + price
- [Token Price](./pricing.md) - Includes bonding curve price
- [Simulate Buy](./simulation.md#simulate-buy) - Estimate trade outcomes

---

Next: [Trade Simulation](./simulation.md) →
