# Quick Start Guide

Get started with OpenPump API in under 5 minutes.

## Prerequisites

- Basic understanding of REST APIs
- Command line tool (curl, httpie, or similar)
- Code editor (for integration)

## Step 1: Get Your API Key

### Free Tier (Testing)
For development and testing, you can use test mode without an API key:

```bash
# Test endpoint (no auth required in test mode)
curl https://api.openpump.io/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump
```

### Paid Tiers
1. Sign up at [openpump.io](https://openpump.io)
2. Choose your tier (Starter, Pro, or Elite)
3. Get your API key from the dashboard
4. Add it to your requests:

```bash
curl https://api.openpump.io/v1/tokens/MINT_ADDRESS \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Step 2: Make Your First Request

### Get Complete Token Data

```bash
curl https://api.openpump.io/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mint": "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump",
    "metadata": {
      "name": "Gummy",
      "symbol": "GUMMY",
      "description": "First memecoin cat on Solana",
      "image": "https://cf-ipfs.com/ipfs/QmZ...",
      "qualityScore": 75,
      "socialLinks": {
        "twitter": "https://twitter.com/gummyonsol"
      }
    },
    "price": {
      "usdPrice": 0.0000056,
      "priceChange24h": 15.5,
      "volume24h": 125000,
      "marketCap": 560000,
      "source": "geckoterminal"
    },
    "category": "graduated",
    "lastUpdated": "2025-11-14T10:30:00Z"
  }
}
```

### Understanding the Response

- **metadata.qualityScore** - 0-100 score based on completeness (name, description, image, socials)
- **metadata.socialLinks** - Automatically extracted from token description
- **price.source** - Where the price came from (bonding-curve, geckoterminal, jupiter)
- **category** - Token lifecycle stage (new, final-stretch, graduated)

## Step 3: Filter by Quality

Only show tokens with quality score > 50:

```bash
curl https://api.openpump.io/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump \
  -H "Authorization: Bearer YOUR_API_KEY" | \
  jq 'select(.data.metadata.qualityScore > 50)'
```

## Step 4: Check Bonding Curve Status

For tokens still in bonding phase:

```bash
curl https://api.openpump.io/v1/tokens/ACTIVE_TOKEN_MINT/bonding \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "virtualSolReserves": 30000000000,
    "virtualTokenReserves": 1073000000000000,
    "realSolReserves": 45000000000,
    "realTokenReserves": 800000000000000,
    "solRaised": 74.5,
    "solRemaining": 10.5,
    "progress": 87.6,
    "complete": false,
    "category": "final-stretch",
    "currentPrice": 0.00000123,
    "graduationEstimate": "~2 hours"
  }
}
```

### Understanding Bonding Curve Data

- **progress** - Percentage toward graduation (0-100%)
- **category** - Lifecycle stage based on progress:
  - `new` - 0-70% progress
  - `final-stretch` - 70-99% progress
  - `graduated` - 100% (moved to Raydium)
- **solRaised** - How much SOL has been raised
- **currentPrice** - Current price from bonding curve formula
- **graduationEstimate** - Estimated time to graduation

## Step 5: Simulate a Trade

Before buying, simulate the trade:

```bash
curl -X POST https://api.openpump.io/v1/tokens/TOKEN_MINT/simulate-buy \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 0.1}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "inputAmount": 0.1,
    "tokensOut": 150000,
    "priceImpact": 0.05,
    "newPrice": 0.00000125,
    "slippage": 0.03
  }
}
```

## Step 6: Integrate Into Your App

### JavaScript/TypeScript

```typescript
const OPENPUMP_API = 'https://api.openpump.io';
const API_KEY = process.env.OPENPUMP_API_KEY;

async function getToken(mint: string) {
  const response = await fetch(`${OPENPUMP_API}/v1/tokens/${mint}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  });

  const data = await response.json();
  return data.data;
}

// Usage
const token = await getToken('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump');

if (token.metadata.qualityScore > 70) {
  console.log(`High quality token: ${token.metadata.name}`);
  console.log(`Category: ${token.category}`);
  console.log(`Price: $${token.price.usdPrice}`);
}
```

### Python

```python
import requests
import os

OPENPUMP_API = 'https://api.openpump.io'
API_KEY = os.getenv('OPENPUMP_API_KEY')

def get_token(mint):
    response = requests.get(
        f'{OPENPUMP_API}/v1/tokens/{mint}',
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    return response.json()['data']

# Usage
token = get_token('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump')

if token['metadata']['qualityScore'] > 70:
    print(f"High quality token: {token['metadata']['name']}")
    print(f"Category: {token['category']}")
    print(f"Price: ${token['price']['usdPrice']}")
```

### Rust

```rust
use reqwest;
use serde_json::Value;

const OPENPUMP_API: &str = "https://api.openpump.io";

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let api_key = std::env::var("OPENPUMP_API_KEY")?;
    let mint = "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump";

    let client = reqwest::Client::new();
    let response = client
        .get(&format!("{}/v1/tokens/{}", OPENPUMP_API, mint))
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await?
        .json::<Value>()
        .await?;

    let token = &response["data"];
    let quality = token["metadata"]["qualityScore"].as_i64().unwrap();

    if quality > 70 {
        println!("High quality token: {}", token["metadata"]["name"]);
        println!("Category: {}", token["category"]);
        println!("Price: ${}", token["price"]["usdPrice"]);
    }

    Ok(())
}
```

## Step 7: Handle Errors

Always handle errors gracefully:

```typescript
async function getTokenSafe(mint: string) {
  try {
    const response = await fetch(`${OPENPUMP_API}/v1/tokens/${mint}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Unknown error');
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch token:', error);
    return null;
  }
}
```

## Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid token address format"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Token not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## Next Steps

- [API Reference](../api-reference/overview.md) - Detailed endpoint documentation
- [Building a Trading Bot](./building-a-bot.md) - Complete tutorial
- [Error Handling](./error-handling.md) - Advanced error handling
- [Rate Limits](./rate-limits.md) - Understanding usage limits

## Need Help?

- **Documentation**: [Full API Reference](../api-reference/overview.md)
- **Examples**: [Code Examples](../examples/code-examples.md)
- **Support**: support@openpump.io
- **Discord**: [Join our community](https://discord.gg/openpump)

---

Ready to dive deeper? Check out the [API Reference](../api-reference/overview.md) →
