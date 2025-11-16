# OpenPump API - Usage Examples

Complete guide with curl examples for all endpoints.

---

## Base URL

```
http://localhost:3000
```

**Production:** `https://api.openpump.io` (when deployed)

---

## Authentication

### Test Mode (Development)
Set `TEST_MODE=true` in `.env` to bypass authentication.

### Production Mode
Include API key in requests:

```bash
# Method 1: Bearer token (recommended)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  http://localhost:3000/v1/tokens/:address

# Method 2: Query parameter
curl http://localhost:3000/v1/tokens/:address?apiKey=YOUR_API_KEY
```

---

## Health Check

Check if API is running:

```bash
curl http://localhost:3000/health | jq '.'
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-14T11:30:00.000Z"
}
```

---

## API Documentation

Interactive Swagger UI:

```bash
open http://localhost:3000/docs
```

---

## Core Endpoints

### 1. Get Complete Token Data

**Endpoint:** `GET /v1/tokens/:address`

Fetches all available data for a token (metadata + price + bonding curve).

**Example:**
```bash
curl http://localhost:3000/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump | jq '.'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mint": "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump",
    "metadata": {
      "mint": "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump",
      "name": "Alienvador",
      "symbol": "Alienvador",
      "description": "Alienvador is preparing to invade the crypto world...",
      "image": "https://ipfs.io/ipfs/bafkreih...",
      "decimals": 6,
      "supply": "1000000000",
      "creator": "BodnbEMCSjKmfqG3ECmuFusC7948wyuH78a8Ad6PibQ9",
      "uri": "https://ipfs.io/ipfs/...",
      "qualityScore": 75,
      "socialLinks": {
        "twitter": "http://memecoins.mom/",
        "website": "http://memecoins.mom/"
      },
      "hasSocial": true
    },
    "price": {
      "mint": "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump",
      "priceUsd": 0.000005673778373,
      "priceSol": 2.79309413654152E-8,
      "marketCapUsd": 5673.778373,
      "liquidityUsd": 4151.4514,
      "volume24h": 0,
      "priceChange24h": 0,
      "source": "geckoterminal",
      "timestamp": "2025-11-14T11:25:25.627Z"
    },
    "category": "graduated",
    "lastUpdated": "2025-11-14T11:25:25.628Z"
  },
  "timestamp": "2025-11-14T11:25:25.628Z"
}
```

**Use Cases:**
- Display complete token card in UI
- One-call data fetch for efficiency
- Get all token information at once

---

### 2. Get Token Metadata

**Endpoint:** `GET /v1/tokens/:address/metadata`

Fetches metadata from blockchain + IPFS with quality scoring.

**Example:**
```bash
curl http://localhost:3000/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump/metadata | jq '.'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mint": "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump",
    "name": "Alienvador",
    "symbol": "Alienvador",
    "description": "Alienvador is preparing to invade the crypto world and is going to take it over",
    "image": "https://ipfs.io/ipfs/bafkreiheh4ufmmqs6hbgwpy77c7qjlqs4cmeq5ul7jskymbnee2rzccgka",
    "decimals": 6,
    "supply": "1000000000",
    "creator": "BodnbEMCSjKmfqG3ECmuFusC7948wyuH78a8Ad6PibQ9",
    "uri": "https://ipfs.io/ipfs/bafkreig6vyoekegbkh4golycahtz2cr3ywdkjnjusldnap4chofg7weis4",
    "qualityScore": 75,
    "socialLinks": {
      "twitter": "http://memecoins.mom/",
      "website": "http://memecoins.mom/"
    },
    "hasSocial": true
  },
  "timestamp": "2025-11-14T11:14:30.123Z"
}
```

**Quality Score Breakdown:**
- Name: 10 points
- Symbol: 10 points
- Description (>50 chars): 15 points
- Image: 15 points
- Creator: 10 points
- URI: 5 points
- Social links: 5-10 points each
- **Max:** 100 points

**Use Cases:**
- Filter low-quality tokens (score < 50)
- Display token information
- Show social links for community verification

---

### 3. Get Token Price

**Endpoint:** `GET /v1/tokens/:address/price`

Fetches real-time price from bonding curve or DEX.

**Example:**
```bash
curl http://localhost:3000/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump/price | jq '.'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "mint": "E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump",
    "priceUsd": 0.000005673778373,
    "priceSol": 2.79309413654152E-8,
    "marketCapUsd": 5673.778373,
    "liquidityUsd": 4151.4514,
    "volume24h": 0,
    "priceChange24h": 0,
    "source": "geckoterminal",
    "timestamp": "2025-11-14T11:14:35.456Z"
  },
  "timestamp": "2025-11-14T11:14:35.456Z"
}
```

**Price Sources (Priority Order):**
1. **bonding-curve** - Direct from pump.fun bonding curve (most accurate)
2. **geckoterminal** - For graduated tokens on Raydium

**Use Cases:**
- Real-time price display
- Portfolio valuation
- Price charts and tracking

---

### 4. Get Bonding Curve Data

**Endpoint:** `GET /v1/tokens/:address/bonding`

Fetches bonding curve state for active pump.fun tokens.

**Example (Active Token):**
```bash
curl http://localhost:3000/v1/tokens/[ACTIVE_TOKEN_ADDRESS]/bonding | jq '.'
```

**Response (Active Bonding Curve):**
```json
{
  "success": true,
  "data": {
    "mint": "...",
    "bondingCurve": "...",
    "progress": 45.67,
    "solRaised": 38.82,
    "solRemaining": 46.18,
    "virtualSolReserves": 50.123,
    "virtualTokenReserves": 1000000000,
    "realSolReserves": 38.82,
    "realTokenReserves": 543210000,
    "currentPrice": 0.00000005012,
    "marketCap": 50.12,
    "category": "new",
    "complete": false,
    "createdAt": "2025-11-14T11:00:00.000Z"
  },
  "timestamp": "2025-11-14T11:14:22.789Z"
}
```

**Example (Graduated Token):**
```bash
curl http://localhost:3000/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump/bonding | jq '.'
```

**Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "BONDING_CURVE_NOT_FOUND",
    "message": "Bonding curve not found - token may be pre-bonded or graduated"
  },
  "timestamp": "2025-11-14T11:14:22.123Z"
}
```

**Categories:**
- **new** - 0-70% progress (lots of room to grow)
- **final-stretch** - 70-99% progress (close to graduation)
- **graduated** - 100% progress (moved to Raydium)

**Use Cases:**
- Track bonding curve progress
- Calculate time to graduation
- Monitor SOL raised
- Identify final-stretch opportunities

---

### 5. Simulate Buy Trade

**Endpoint:** `POST /v1/tokens/:address/simulate-buy`

Simulates a buy trade on bonding curve to calculate tokens out and price impact.

**Example:**
```bash
curl -X POST http://localhost:3000/v1/tokens/[ACTIVE_TOKEN_ADDRESS]/simulate-buy \
  -H "Content-Type: application/json" \
  -d '{"amount": 0.1}' | jq '.'
```

**Request Body:**
```json
{
  "amount": 0.1  // SOL amount to spend
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokensOut": 1999600.159936,
    "priceImpact": 0.000199936,
    "newPrice": 0.00000005002
  },
  "timestamp": "2025-11-14T11:15:00.000Z"
}
```

**Use Cases:**
- Show users expected tokens before trade
- Display price impact warning
- Calculate optimal trade size
- Build trading interfaces

---

### 6. Simulate Sell Trade

**Endpoint:** `POST /v1/tokens/:address/simulate-sell`

Simulates a sell trade on bonding curve to calculate SOL out and price impact.

**Example:**
```bash
curl -X POST http://localhost:3000/v1/tokens/[ACTIVE_TOKEN_ADDRESS]/simulate-sell \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000000}' | jq '.'
```

**Request Body:**
```json
{
  "amount": 1000000  // Token amount to sell
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "solOut": 0.049975,
    "priceImpact": -0.000099950,
    "newPrice": 0.00000004996
  },
  "timestamp": "2025-11-14T11:15:30.000Z"
}
```

**Use Cases:**
- Show users expected SOL before sell
- Display price impact warning
- Calculate optimal sell size
- Build trading interfaces

---

## Error Handling

### 404 - Not Found
```json
{
  "success": false,
  "error": {
    "code": "TOKEN_NOT_FOUND",
    "message": "Token not found or data unavailable"
  },
  "timestamp": "2025-11-14T11:16:00.000Z"
}
```

### 400 - Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "path": "address",
        "message": "String must contain exactly 44 character(s)"
      }
    ]
  },
  "timestamp": "2025-11-14T11:16:30.000Z"
}
```

### 429 - Rate Limit
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please upgrade your plan."
  },
  "timestamp": "2025-11-14T11:17:00.000Z"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  },
  "timestamp": "2025-11-14T11:17:30.000Z"
}
```

---

## Rate Limits

| Tier | Requests/Min | Requests/Day | Price |
|------|-------------|--------------|-------|
| Free | 10 | 1,000 | $0 |
| Starter | 60 | 10,000 | $49/mo |
| Pro | 300 | 100,000 | $149/mo |
| Elite | 1,000 | 1,000,000 | $249/mo |

---

## Best Practices

### 1. Cache Responses
```javascript
// Cache metadata (changes rarely)
const metadata = await fetch('/tokens/:address/metadata');
// Cache for 5 minutes

// Cache price (changes frequently)
const price = await fetch('/tokens/:address/price');
// Cache for 10-30 seconds
```

### 2. Handle Errors Gracefully
```javascript
try {
  const response = await fetch('/tokens/:address');
  const data = await response.json();

  if (!data.success) {
    console.error(data.error.message);
    // Show fallback UI
  }
} catch (error) {
  // Handle network errors
}
```

### 3. Use Complete Endpoint for Efficiency
```javascript
// ❌ Bad: 3 separate calls
const metadata = await fetch('/tokens/:address/metadata');
const price = await fetch('/tokens/:address/price');
const bonding = await fetch('/tokens/:address/bonding');

// ✅ Good: 1 call gets everything
const complete = await fetch('/tokens/:address');
```

### 4. Filter by Quality Score
```javascript
// Only show high-quality tokens
const tokens = await fetchTokens();
const quality = tokens.filter(t => t.metadata.qualityScore >= 60);
```

### 5. Check Source for Price Accuracy
```javascript
const { price } = await fetch('/tokens/:address');

if (price.source === 'bonding-curve') {
  // Most accurate - direct from blockchain
  console.log('Real-time bonding curve price');
} else if (price.source === 'geckoterminal') {
  // DEX price for graduated tokens
  console.log('DEX price (graduated token)');
}
```

---

## Integration Examples

### React Component
```typescript
import { useState, useEffect } from 'react';

function TokenCard({ address }: { address: string }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3000/v1/tokens/${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setToken(data.data);
        }
        setLoading(false);
      });
  }, [address]);

  if (loading) return <div>Loading...</div>;
  if (!token) return <div>Token not found</div>;

  return (
    <div className="token-card">
      <img src={token.metadata.image} alt={token.metadata.name} />
      <h3>{token.metadata.name} ({token.metadata.symbol})</h3>
      <p>Quality: {token.metadata.qualityScore}/100</p>
      <p>Price: ${token.price?.priceUsd.toFixed(8)}</p>
      <p>Market Cap: ${token.price?.marketCapUsd.toLocaleString()}</p>
      {token.metadata.socialLinks.twitter && (
        <a href={token.metadata.socialLinks.twitter}>Twitter</a>
      )}
    </div>
  );
}
```

### Node.js Script
```javascript
const axios = require('axios');

async function analyzeToken(address) {
  try {
    const { data } = await axios.get(
      `http://localhost:3000/v1/tokens/${address}`
    );

    if (!data.success) {
      console.log('Token not found');
      return;
    }

    const { metadata, price, category } = data.data;

    console.log(`Token: ${metadata.name} (${metadata.symbol})`);
    console.log(`Quality: ${metadata.qualityScore}/100`);
    console.log(`Price: $${price?.priceUsd}`);
    console.log(`Category: ${category}`);
    console.log(`Social: ${metadata.hasSocial ? 'Yes' : 'No'}`);
  } catch (error) {
    console.error('Error fetching token:', error.message);
  }
}

analyzeToken('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump');
```

### Python Script
```python
import requests

def get_token_data(address):
    url = f"http://localhost:3000/v1/tokens/{address}"
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        if data['success']:
            token = data['data']
            print(f"Token: {token['metadata']['name']}")
            print(f"Quality: {token['metadata']['qualityScore']}/100")
            print(f"Price: ${token['price']['priceUsd']}")
            return token

    return None

token = get_token_data('E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump')
```

---

## Testing Endpoints

Quick test script:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN="E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump"

echo "Testing OpenPump API..."
echo ""

echo "1. Health Check"
curl -s $BASE_URL/health | jq '.status'
echo ""

echo "2. Complete Token Data"
curl -s $BASE_URL/v1/tokens/$TOKEN | jq '.data.metadata.name'
echo ""

echo "3. Metadata"
curl -s $BASE_URL/v1/tokens/$TOKEN/metadata | jq '.data.qualityScore'
echo ""

echo "4. Price"
curl -s $BASE_URL/v1/tokens/$TOKEN/price | jq '.data.priceUsd'
echo ""

echo "5. Bonding Curve"
curl -s $BASE_URL/v1/tokens/$TOKEN/bonding | jq '.error.code // "HAS_CURVE"'
echo ""

echo "All tests complete!"
```

---

## Support

- **Issues:** https://github.com/yourusername/openpump-api/issues
- **Docs:** http://localhost:3000/docs
- **Discord:** [Your Discord server]

---

**Happy Building! 🚀**
