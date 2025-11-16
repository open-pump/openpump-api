# API Reference Overview

Complete reference for the OpenPump API.

## Base URL

```
Production: https://api.openpump.io
Staging:    https://staging.openpump.io
```

## API Version

Current version: **v1**

All endpoints are prefixed with `/v1/`

## Authentication

All requests require authentication via API key in the `Authorization` header:

```http
Authorization: Bearer YOUR_API_KEY
```

See [Authentication Guide](./authentication.md) for details.

## Request Format

### Headers

```http
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

### Query Parameters

Some endpoints support query parameters for filtering and pagination:

```
GET /v1/tokens?category=final-stretch&limit=20&offset=0
```

### Request Body

POST endpoints expect JSON bodies:

```json
{
  "amount": 0.1
}
```

## Response Format

### Success Response

All successful responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "timestamp": "2025-11-14T10:30:00Z"
}
```

### Error Response

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| **200** | OK | Request succeeded |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid request parameters |
| **401** | Unauthorized | Missing or invalid API key |
| **403** | Forbidden | Valid API key but insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server error (please report) |
| **503** | Service Unavailable | Temporary outage |

## Rate Limits

Rate limits vary by tier:

| Tier | Requests/Minute | Requests/Day |
|------|-----------------|--------------|
| Free | 10 | 1,000 |
| Starter | 60 | 10,000 |
| Pro | 300 | 100,000 |
| Elite | 1,000 | 1,000,000 |

Rate limit headers are included in every response:

```http
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 285
X-RateLimit-Reset: 1700000000
```

See [Rate Limits Guide](../guides/rate-limits.md) for details.

## Pagination

Endpoints that return lists support pagination:

```
GET /v1/tokens/recent?limit=50&offset=100
```

**Parameters:**
- `limit` - Number of results per page (default: 20, max: 100)
- `offset` - Number of results to skip (default: 0)

**Response includes pagination metadata:**

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 1000,
    "limit": 50,
    "offset": 100,
    "hasMore": true
  }
}
```

## Filtering

Many endpoints support filtering via query parameters:

```
GET /v1/tokens?category=final-stretch&minQuality=70
```

**Common filters:**
- `category` - Token category (new, final-stretch, graduated)
- `minQuality` - Minimum quality score (0-100)
- `hasSocial` - Has social links (true/false)

## Sorting

List endpoints support sorting:

```
GET /v1/tokens/recent?sortBy=qualityScore&sortOrder=desc
```

**Parameters:**
- `sortBy` - Field to sort by (createdAt, qualityScore, marketCap, etc.)
- `sortOrder` - Sort direction (asc, desc)

## Timestamps

All timestamps are in ISO 8601 format (UTC):

```
2025-11-14T10:30:00Z
```

## Data Types

### Token Address

Solana mint address (base58 encoded):

```
E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump
```

### Numbers

- **Integers**: 1, 100, 1000
- **Decimals**: 0.1, 0.0000056 (USD prices)
- **Large numbers**: Returned as strings to prevent precision loss

### Booleans

```json
{
  "complete": true,
  "hasSocial": false
}
```

## Caching

Responses include cache headers:

```http
Cache-Control: public, max-age=10
ETag: "abc123"
```

**Cache durations by endpoint:**
- Token metadata: 5 minutes
- Token price: 10 seconds
- Bonding curve: 30 seconds
- Complete data: 30 seconds

You can use `If-None-Match` header for conditional requests:

```http
If-None-Match: "abc123"
```

Returns `304 Not Modified` if content unchanged.

## Webhooks

Coming soon! Subscribe to real-time events:

- Token created
- Token graduated
- Price alerts
- Volume spikes

## WebSocket

Coming soon! Real-time streaming:

```javascript
const ws = new WebSocket('wss://api.openpump.io/v1/stream');

ws.on('message', (data) => {
  console.log('New token:', JSON.parse(data));
});
```

## SDK Libraries

Official SDKs coming soon:

- **JavaScript/TypeScript** - npm install @openpump/sdk
- **Python** - pip install openpump
- **Rust** - cargo add openpump

## OpenAPI Specification

Download the complete OpenAPI spec:

```
https://api.openpump.io/openapi.json
```

Import into tools like Postman, Insomnia, or swagger-ui.

## Endpoints

### Token Endpoints

- [Complete Token Data](./endpoints/tokens.md) - `GET /v1/tokens/:address`
- [Token Metadata](./endpoints/metadata.md) - `GET /v1/tokens/:address/metadata`
- [Token Price](./endpoints/pricing.md) - `GET /v1/tokens/:address/price`
- [Bonding Curve](./endpoints/bonding.md) - `GET /v1/tokens/:address/bonding`

### Simulation Endpoints

- [Simulate Buy](./endpoints/simulation.md#simulate-buy) - `POST /v1/tokens/:address/simulate-buy`
- [Simulate Sell](./endpoints/simulation.md#simulate-sell) - `POST /v1/tokens/:address/simulate-sell`

### Discovery Endpoints (Coming Soon)

- Recent Tokens - `GET /v1/tokens/recent`
- Trending Tokens - `GET /v1/tokens/trending`
- Search Tokens - `GET /v1/tokens/search`

## Best Practices

### 1. Cache Responses

Cache responses on your end to minimize API calls:

```typescript
const cache = new Map();

async function getToken(mint: string) {
  if (cache.has(mint)) {
    return cache.get(mint);
  }

  const token = await fetchFromAPI(mint);
  cache.set(mint, token);

  setTimeout(() => cache.delete(mint), 30000); // 30s TTL
  return token;
}
```

### 2. Handle Rate Limits

Respect rate limits and implement backoff:

```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await sleep(retryAfter * 1000);
      continue;
    }

    return response;
  }

  throw new Error('Max retries exceeded');
}
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
try {
  const token = await getToken(mint);
} catch (error) {
  if (error.code === 'NOT_FOUND') {
    // Token doesn't exist
  } else if (error.code === 'RATE_LIMIT') {
    // Wait and retry
  } else {
    // Log and report
    console.error('Unexpected error:', error);
  }
}
```

### 4. Use Appropriate Endpoints

Don't fetch complete data if you only need price:

```typescript
// ❌ Wasteful
const token = await getCompleteToken(mint);
const price = token.price.usdPrice;

// ✅ Efficient
const price = await getTokenPrice(mint);
```

## Need Help?

- **API Issues**: [GitHub Issues](https://github.com/openpump/openpump-api/issues)
- **Questions**: support@openpump.io
- **Community**: [Discord](https://discord.gg/openpump)

---

Next: [Authentication Guide](./authentication.md) →
