# Token Price

Get real-time token pricing data from multiple sources.

## Endpoint

```
GET /v1/tokens/:address/price
```

## Description

Returns real-time price data with multi-source fallback strategy. Prioritizes blockchain-direct bonding curve pricing, then falls back to DEX aggregators.

**Use this when:** You only need current price data without metadata or bonding details.

## Request

```bash
curl https://api.openpump.io/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump/price \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Response

```json
{
  "success": true,
  "data": {
    "usdPrice": 0.0000056,
    "solPrice": 0.00000005,
    "priceChange24h": 15.5,
    "volume24h": 125000,
    "marketCap": 560000,
    "source": "geckoterminal",
    "lastUpdated": "2025-11-14T10:30:00Z"
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `usdPrice` | number | Current price in USD |
| `solPrice` | number | Current price in SOL |
| `priceChange24h` | number | 24-hour price change (percentage) |
| `volume24h` | number | 24-hour trading volume (USD) |
| `marketCap` | number | Market capitalization (USD) |
| `source` | string | Price data source |
| `lastUpdated` | string | ISO 8601 timestamp |

## Price Sources

OpenPump uses a prioritized multi-source strategy for maximum accuracy:

### 1. Bonding Curve (Highest Priority)

For tokens still in bonding phase, prices are calculated directly from the bonding curve formula on-chain.

**Advantages:**
- Most accurate (direct from blockchain)
- Real-time updates
- No delays

**Source identifier:** `bonding-curve`

**Example:**
```json
{
  "usdPrice": 0.00000123,
  "source": "bonding-curve"
}
```

### 2. GeckoTerminal

For graduated tokens on Raydium DEX.

**Advantages:**
- Comprehensive DEX coverage
- Market data included

**Source identifier:** `geckoterminal`

### 3. Jupiter

Fallback for tokens not found on GeckoTerminal.

**Advantages:**
- Aggregates multiple DEXs
- Wide coverage

**Source identifier:** `jupiter`

## Price Accuracy by Source

| Source | Accuracy | Latency | Use Case |
|--------|----------|---------|----------|
| **bonding-curve** | ★★★★★ | <100ms | Active bonding tokens |
| **geckoterminal** | ★★★★☆ | ~1-2s | Graduated tokens on Raydium |
| **jupiter** | ★★★☆☆ | ~2-5s | Tokens on other DEXs |

## Code Examples

### Price Tracking

```typescript
async function trackPrice(mint: string, interval: number = 10000) {
  setInterval(async () => {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}/price`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    const { data } = await response.json();

    console.log(`Price: $${data.usdPrice.toFixed(8)}`);
    console.log(`24h Change: ${data.priceChange24h.toFixed(2)}%`);
    console.log(`Source: ${data.source}`);
  }, interval);
}

// Track price every 10 seconds
trackPrice('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump');
```

### Price Alerts

```typescript
async function createPriceAlert(
  mint: string,
  targetPrice: number,
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

    if (data.usdPrice >= targetPrice) {
      callback(data.usdPrice);
      return true;
    }

    return false;
  };

  const interval = setInterval(async () => {
    const triggered = await check();
    if (triggered) {
      clearInterval(interval);
    }
  }, 10000); // Check every 10 seconds
}

// Alert when price reaches $0.00001
createPriceAlert('MINT_ADDRESS', 0.00001, (price) => {
  console.log(`🚨 Target price reached: $${price}`);
});
```

### Portfolio Value

```typescript
async function calculatePortfolioValue(holdings: Array<{mint: string, amount: number}>) {
  let totalValue = 0;

  for (const { mint, amount } of holdings) {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}/price`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    const { data } = await response.json();
    const value = data.usdPrice * amount;
    totalValue += value;

    console.log(`${mint}: ${amount.toLocaleString()} tokens = $${value.toFixed(2)}`);
  }

  console.log(`\nTotal Portfolio Value: $${totalValue.toFixed(2)}`);
  return totalValue;
}
```

## Performance

- **Uncached**: ~874ms
  - Bonding curve: ~100ms
  - GeckoTerminal: ~1-2s
  - Jupiter: ~2-5s
- **Cached**: ~15ms
- **Cache TTL**: 10 seconds

## Caching Strategy

Prices are cached for 10 seconds to balance freshness with performance:

- For real-time trading, poll every 10-15 seconds
- For portfolio tracking, poll every 1-5 minutes
- For historical analysis, use less frequent polling

## Rate Limiting

To minimize rate limit usage:

1. **Cache on your end**: Store prices for 10-30 seconds
2. **Batch requests**: If tracking multiple tokens, space out requests
3. **Use WebSockets**: Subscribe to real-time updates (coming soon)

## Error Responses

### Token Has No Price Data

```json
{
  "success": false,
  "error": "Price data unavailable",
  "code": "NO_PRICE_DATA",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

This can happen for:
- Very new tokens (<5 minutes old)
- Tokens with no trading activity
- Invalid/non-existent tokens

## Related Endpoints

- [Complete Token Data](./tokens.md) - Price + metadata + bonding
- [Bonding Curve](./bonding.md) - Detailed bonding curve data
- [Simulate Buy](./simulation.md#simulate-buy) - Estimate trade price impact

---

Next: [Bonding Curve](./bonding.md) →
