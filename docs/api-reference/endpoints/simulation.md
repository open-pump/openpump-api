# Trade Simulation

Simulate buy and sell trades to estimate price impact and token output before executing.

## Endpoints

```
POST /v1/tokens/:address/simulate-buy
POST /v1/tokens/:address/simulate-sell
```

## Description

Simulate trades using the bonding curve formula to estimate outcomes without executing on-chain. Only works for tokens still in bonding phase.

**Use this when:** You want to estimate trade outcomes before executing.

---

## Simulate Buy

### Endpoint

```
POST /v1/tokens/:address/simulate-buy
```

### Request

```bash
curl -X POST https://api.openpump.io/v1/tokens/ACTIVE_TOKEN_MINT/simulate-buy \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 0.1}'
```

### Request Body

```json
{
  "amount": 0.1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount of SOL to spend |

### Response

```json
{
  "success": true,
  "data": {
    "inputAmount": 0.1,
    "tokensOut": 150000,
    "priceImpact": 0.05,
    "currentPrice": 0.00000120,
    "newPrice": 0.00000126,
    "slippage": 0.03,
    "averagePrice": 0.00000123,
    "marketCapImpact": 5000
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `inputAmount` | number | SOL amount to spend |
| `tokensOut` | number | Estimated tokens received |
| `priceImpact` | number | Price impact percentage |
| `currentPrice` | number | Current price before trade |
| `newPrice` | number | New price after trade |
| `slippage` | number | Expected slippage percentage |
| `averagePrice` | number | Average execution price |
| `marketCapImpact` | number | Market cap increase (USD) |

---

## Simulate Sell

### Endpoint

```
POST /v1/tokens/:address/simulate-sell
```

### Request

```bash
curl -X POST https://api.openpump.io/v1/tokens/ACTIVE_TOKEN_MINT/simulate-sell \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100000}'
```

### Request Body

```json
{
  "amount": 100000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount of tokens to sell |

### Response

```json
{
  "success": true,
  "data": {
    "inputAmount": 100000,
    "solOut": 0.085,
    "priceImpact": -0.04,
    "currentPrice": 0.00000120,
    "newPrice": 0.00000115,
    "slippage": 0.02,
    "averagePrice": 0.00000117,
    "marketCapImpact": -4200
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `inputAmount` | number | Token amount to sell |
| `solOut` | number | Estimated SOL received |
| `priceImpact` | number | Price impact percentage (negative) |
| `currentPrice` | number | Current price before trade |
| `newPrice` | number | New price after trade |
| `slippage` | number | Expected slippage percentage |
| `averagePrice` | number | Average execution price |
| `marketCapImpact` | number | Market cap decrease (USD) |

---

## Understanding Simulations

### Constant Product Formula

Pump.fun bonding curves use the constant product formula:

```
x × y = k (constant)

where:
x = SOL reserves
y = Token reserves
k = constant product
```

### Buy Simulation

1. Calculate new SOL reserves: `newX = currentX + inputSOL`
2. Calculate new token reserves: `newY = k / newX`
3. Tokens out: `tokensOut = currentY - newY`
4. Price impact: `(newPrice - currentPrice) / currentPrice`

### Sell Simulation

1. Calculate new token reserves: `newY = currentY + inputTokens`
2. Calculate new SOL reserves: `newX = k / newY`
3. SOL out: `solOut = currentX - newX`
4. Price impact: `(newPrice - currentPrice) / currentPrice` (negative)

### Price Impact

Price impact measures how much your trade moves the price:

- **0-1%**: Minimal impact (small trade)
- **1-3%**: Moderate impact
- **3-5%**: Significant impact
- **>5%**: High impact (large trade)

### Slippage

Slippage is the difference between expected and actual execution price:

- Set slippage tolerance in your trading client
- Recommended: 1-5% for bonding curve trades
- Higher for volatile tokens

## Code Examples

### Pre-Trade Validation

```typescript
async function validateTrade(mint: string, solAmount: number) {
  const response = await fetch(
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

  const { data } = await response.json();

  // Validation checks
  const checks = {
    reasonableImpact: data.priceImpact < 5, // Less than 5%
    acceptableSlippage: data.slippage < 3, // Less than 3%
    minimumOut: data.tokensOut > 1000, // At least 1000 tokens
  };

  if (Object.values(checks).every(Boolean)) {
    console.log('✅ Trade validated');
    console.log(`Tokens out: ${data.tokensOut.toLocaleString()}`);
    console.log(`Price impact: ${data.priceImpact.toFixed(2)}%`);
    return true;
  } else {
    console.log('⚠️ Trade validation failed:', checks);
    return false;
  }
}

// Usage
const isValid = await validateTrade('MINT', 0.5);
if (isValid) {
  // Execute trade
}
```

### Find Optimal Trade Size

```typescript
async function findOptimalTradeSize(
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
const maxSol = await findOptimalTradeSize('MINT', 3); // Max 3% impact
console.log(`Optimal trade size: ${maxSol.toFixed(2)} SOL`);
```

### Compare Buy vs Sell

```typescript
async function compareTradeOutcomes(mint: string) {
  // Simulate buying 0.1 SOL
  const buyResponse = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}/simulate-buy`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 0.1 }),
    }
  );

  const buyData = (await buyResponse.json()).data;

  // Simulate selling those tokens back
  const sellResponse = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}/simulate-sell`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: buyData.tokensOut }),
    }
  );

  const sellData = (await sellResponse.json()).data;

  console.log('Buy 0.1 SOL:');
  console.log(`- Tokens out: ${buyData.tokensOut.toLocaleString()}`);
  console.log(`- Price impact: ${buyData.priceImpact.toFixed(2)}%`);

  console.log('\nSell those tokens:');
  console.log(`- SOL out: ${sellData.solOut.toFixed(4)}`);
  console.log(`- Price impact: ${sellData.priceImpact.toFixed(2)}%`);

  const roundTripLoss = ((0.1 - sellData.solOut) / 0.1) * 100;
  console.log(`\nRound-trip loss: ${roundTripLoss.toFixed(2)}%`);
}

// Usage
await compareTradeOutcomes('MINT');
```

### Slippage Protection

```typescript
async function executeSafeTrade(
  mint: string,
  solAmount: number,
  maxSlippage: number = 2
) {
  const response = await fetch(
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

  const { data } = await response.json();

  if (data.slippage > maxSlippage) {
    throw new Error(
      `Slippage too high: ${data.slippage.toFixed(2)}% (max: ${maxSlippage}%)`
    );
  }

  // Calculate minimum tokens out with slippage
  const minTokensOut = data.tokensOut * (1 - maxSlippage / 100);

  console.log(`Expected tokens: ${data.tokensOut.toLocaleString()}`);
  console.log(`Minimum tokens (with slippage): ${minTokensOut.toLocaleString()}`);

  // Execute trade with minimum output protection
  // await executeTrade(mint, solAmount, minTokensOut);
}

// Usage
await executeSafeTrade('MINT', 0.5, 2); // Max 2% slippage
```

## Error Responses

### Token Graduated

```json
{
  "success": false,
  "error": "Token has graduated, use DEX for trading",
  "code": "GRADUATED",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Invalid Amount

```json
{
  "success": false,
  "error": "Amount must be positive",
  "code": "INVALID_AMOUNT",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Amount Too Large

```json
{
  "success": false,
  "error": "Amount exceeds available liquidity",
  "code": "INSUFFICIENT_LIQUIDITY",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Limitations

1. **Bonding phase only**: Simulations only work for tokens in bonding phase
2. **No MEV protection**: Actual execution may differ due to MEV/frontrunning
3. **Network fees**: Gas fees not included in simulation
4. **Slippage**: Actual slippage may vary from estimate

## Best Practices

1. **Always simulate first**: Never execute trades without simulating
2. **Set slippage tolerance**: Use 1-5% for most trades
3. **Check price impact**: Avoid trades with >5% impact
4. **Split large trades**: Break large trades into smaller chunks
5. **Monitor bonding status**: Token may graduate mid-trade

## Related Endpoints

- [Bonding Curve](./bonding.md) - Get current bonding state
- [Token Price](./pricing.md) - Current price data
- [Complete Token Data](./tokens.md) - Full token analysis

---

Ready to build? Check out the [Code Examples](../../examples/code-examples.md) →
