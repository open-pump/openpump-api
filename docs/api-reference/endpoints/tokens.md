# Complete Token Data

Get complete token analysis including metadata, price, and bonding curve data in a single request.

## Endpoint

```
GET /v1/tokens/:address
```

## Description

Returns comprehensive token data combining metadata (with quality scoring), real-time pricing, bonding curve metrics, and categorization.

**Use this endpoint when:** You need all available data about a token in one request.

**Use specific endpoints when:** You only need metadata, price, or bonding curve data separately to save bandwidth and improve performance.

## Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | Yes | Token mint address (base58 encoded Solana address) |

### Example

```
E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump
```

## Request

```bash
curl https://api.openpump.io/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "mint": "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump",
    "metadata": {
      "name": "Gummy",
      "symbol": "GUMMY",
      "description": "First memecoin cat on Solana",
      "image": "https://cf-ipfs.com/ipfs/QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2DNDaYYevErzwLFd",
      "creatorAddress": "39azUYFWPz3VHgKCf3VChUwbpURdCHRxjWVowf5jUJjg",
      "qualityScore": 75,
      "hasSocial": true,
      "socialLinks": {
        "twitter": "https://twitter.com/gummyonsol",
        "telegram": null,
        "discord": null,
        "website": null
      }
    },
    "price": {
      "usdPrice": 0.0000056,
      "solPrice": 0.00000005,
      "priceChange24h": 15.5,
      "volume24h": 125000,
      "marketCap": 560000,
      "source": "geckoterminal",
      "lastUpdated": "2025-11-14T10:30:00Z"
    },
    "bonding": null,
    "category": "graduated",
    "lastUpdated": "2025-11-14T10:30:00Z"
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `mint` | string | Token mint address |
| `metadata` | object | Token metadata and quality scoring |
| `metadata.name` | string | Token name |
| `metadata.symbol` | string | Token symbol/ticker |
| `metadata.description` | string | Token description |
| `metadata.image` | string | IPFS image URL |
| `metadata.creatorAddress` | string | Token creator's wallet address |
| `metadata.qualityScore` | number | Quality score 0-100 |
| `metadata.hasSocial` | boolean | Has any social links |
| `metadata.socialLinks` | object | Extracted social links |
| `price` | object \| null | Pricing data (null if unavailable) |
| `price.usdPrice` | number | Price in USD |
| `price.solPrice` | number | Price in SOL |
| `price.priceChange24h` | number | 24h price change percentage |
| `price.volume24h` | number | 24h trading volume in USD |
| `price.marketCap` | number | Market capitalization in USD |
| `price.source` | string | Price source (bonding-curve, geckoterminal, jupiter) |
| `bonding` | object \| null | Bonding curve data (null if graduated) |
| `category` | string | Token category (new, final-stretch, graduated, unknown) |
| `lastUpdated` | string | ISO 8601 timestamp of last update |

## Bonding Curve Data (Active Tokens)

For tokens still in bonding phase:

```json
{
  "success": true,
  "data": {
    "mint": "ACTIVE_TOKEN_MINT",
    "metadata": { ... },
    "price": {
      "usdPrice": 0.00000123,
      "source": "bonding-curve",
      ...
    },
    "bonding": {
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
    },
    "category": "final-stretch",
    "lastUpdated": "2025-11-14T10:30:00Z"
  }
}
```

## Token Categories

| Category | Description | Progress |
|----------|-------------|----------|
| `new` | Just launched, early bonding phase | 0-70% |
| `final-stretch` | Close to graduation | 70-99% |
| `graduated` | Moved to Raydium DEX | 100% |
| `unknown` | Cannot determine status | N/A |

## Error Responses

### Invalid Address Format (400)

```json
{
  "success": false,
  "error": "Invalid token address format",
  "code": "INVALID_ADDRESS",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Token Not Found (404)

```json
{
  "success": false,
  "error": "Token not found",
  "code": "NOT_FOUND",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Rate Limit Exceeded (429)

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 60,
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Code Examples

### JavaScript/TypeScript

```typescript
async function getCompleteTokenData(mint: string) {
  const response = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();
  return result.data;
}

// Usage
const token = await getCompleteTokenData('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump');

console.log(`Token: ${token.metadata.name} (${token.metadata.symbol})`);
console.log(`Quality Score: ${token.metadata.qualityScore}/100`);
console.log(`Category: ${token.category}`);
console.log(`Price: $${token.price.usdPrice}`);

if (token.bonding) {
  console.log(`Bonding Progress: ${token.bonding.progress.toFixed(2)}%`);
  console.log(`SOL Raised: ${token.bonding.solRaised} SOL`);
}
```

### Python

```python
import requests
import os

def get_complete_token_data(mint: str):
    response = requests.get(
        f'https://api.openpump.io/v1/tokens/{mint}',
        headers={'Authorization': f'Bearer {os.getenv("OPENPUMP_API_KEY")}'}
    )

    response.raise_for_status()
    return response.json()['data']

# Usage
token = get_complete_token_data('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump')

print(f"Token: {token['metadata']['name']} ({token['metadata']['symbol']})")
print(f"Quality Score: {token['metadata']['qualityScore']}/100")
print(f"Category: {token['category']}")
print(f"Price: ${token['price']['usdPrice']}")

if token['bonding']:
    print(f"Bonding Progress: {token['bonding']['progress']:.2f}%")
    print(f"SOL Raised: {token['bonding']['solRaised']} SOL")
```

### Rust

```rust
use reqwest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
struct ApiResponse {
    success: bool,
    data: TokenData,
}

#[derive(Debug, Deserialize)]
struct TokenData {
    mint: String,
    metadata: TokenMetadata,
    price: Option<TokenPrice>,
    bonding: Option<BondingCurve>,
    category: String,
}

#[derive(Debug, Deserialize)]
struct TokenMetadata {
    name: String,
    symbol: String,
    #[serde(rename = "qualityScore")]
    quality_score: u8,
}

#[derive(Debug, Deserialize)]
struct TokenPrice {
    #[serde(rename = "usdPrice")]
    usd_price: f64,
}

#[derive(Debug, Deserialize)]
struct BondingCurve {
    progress: f64,
    #[serde(rename = "solRaised")]
    sol_raised: f64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let api_key = std::env::var("OPENPUMP_API_KEY")?;
    let mint = "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump";

    let client = reqwest::Client::new();
    let response = client
        .get(&format!("https://api.openpump.io/v1/tokens/{}", mint))
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await?
        .json::<ApiResponse>()
        .await?;

    let token = response.data;
    println!("Token: {} ({})", token.metadata.name, token.metadata.symbol);
    println!("Quality Score: {}/100", token.metadata.quality_score);
    println!("Category: {}", token.category);

    if let Some(price) = token.price {
        println!("Price: ${}", price.usd_price);
    }

    if let Some(bonding) = token.bonding {
        println!("Bonding Progress: {:.2}%", bonding.progress);
        println!("SOL Raised: {} SOL", bonding.sol_raised);
    }

    Ok(())
}
```

## Use Cases

### 1. Token Scanner

Scan multiple tokens and filter by quality:

```typescript
const tokens = [
  'E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump',
  // ... more mints
];

for (const mint of tokens) {
  const token = await getCompleteTokenData(mint);

  if (token.metadata.qualityScore > 70 && token.category === 'final-stretch') {
    console.log(`🔥 High quality token near graduation: ${token.metadata.name}`);
    console.log(`   Progress: ${token.bonding.progress.toFixed(2)}%`);
    console.log(`   Twitter: ${token.metadata.socialLinks.twitter}`);
  }
}
```

### 2. Portfolio Tracker

Track your token holdings:

```typescript
const holdings = [
  { mint: 'ABC...', amount: 1000000 },
  { mint: 'DEF...', amount: 500000 },
];

let totalValue = 0;

for (const holding of holdings) {
  const token = await getCompleteTokenData(holding.mint);
  const value = token.price.usdPrice * holding.amount;
  totalValue += value;

  console.log(`${token.metadata.name}: $${value.toFixed(2)}`);
}

console.log(`Total Portfolio Value: $${totalValue.toFixed(2)}`);
```

### 3. Trading Signal

Generate trading signals based on token data:

```typescript
async function generateSignal(mint: string) {
  const token = await getCompleteTokenData(mint);

  const signals = {
    quality: token.metadata.qualityScore > 70,
    hasSocials: token.metadata.hasSocial,
    nearGraduation: token.bonding?.progress > 85,
    priceUp: token.price.priceChange24h > 10,
  };

  const score = Object.values(signals).filter(Boolean).length;

  if (score >= 3) {
    return 'BUY';
  } else if (score <= 1) {
    return 'AVOID';
  } else {
    return 'HOLD';
  }
}
```

## Performance

- **Uncached**: ~900ms (fetches from blockchain + IPFS + DEX)
- **Cached**: ~15ms (98% faster)
- **Cache TTL**: 30 seconds

## Rate Limits

- Counts as **1 request** against your tier limit
- Use specific endpoints (metadata, price, bonding) separately if you don't need all data

## Related Endpoints

- [Token Metadata](./metadata.md) - Metadata + quality scoring only
- [Token Price](./pricing.md) - Price data only
- [Bonding Curve](./bonding.md) - Bonding curve data only

---

Next: [Token Metadata](./metadata.md) →
