# Rate Limits Guide

Understanding and working with OpenPump API rate limits.

## Rate Limit Tiers

| Tier | Requests/Minute | Requests/Day | Best For |
|------|-----------------|--------------|----------|
| **Free** | 10 | 1,000 | Testing, hobbyists |
| **Starter** | 60 | 10,000 | Small apps, bots |
| **Pro** | 300 | 100,000 | Growing apps |
| **Elite** | 1,000 | 1,000,000 | Production apps |

## Rate Limit Headers

Every API response includes rate limit headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 285
X-RateLimit-Reset: 1700000000
```

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Your tier's request limit per minute |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Unix timestamp when limit resets |

## Rate Limit Response

When you exceed your limit:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 60,
  "limit": 300,
  "remaining": 0,
  "reset": 1700000000,
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Best Practices

### 1. Check Rate Limit Headers

Always check remaining requests:

```typescript
async function fetchWithRateCheck(url: string, apiKey: string) {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
  const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

  if (remaining < 10) {
    const waitTime = (reset * 1000) - Date.now();
    console.warn(`⚠️ Low rate limit! ${remaining} requests left. Resets in ${waitTime}ms`);
  }

  return response;
}
```

### 2. Implement Exponential Backoff

Retry with increasing delays:

```typescript
async function fetchWithRetry(
  url: string,
  apiKey: string,
  maxRetries: number = 3
) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        const delay = Math.min(retryAfter * 1000 * Math.pow(2, attempt), 60000);

        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(1000 * Math.pow(2, attempt));
    }
  }

  throw new Error('Max retries exceeded');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 3. Use Client-Side Caching

Cache responses to reduce API calls:

```typescript
class CachedAPIClient {
  private cache = new Map<string, { data: any; expiry: number }>();

  async get(url: string, apiKey: string, ttl: number = 30000) {
    const cached = this.cache.get(url);

    if (cached && Date.now() < cached.expiry) {
      console.log('📦 Cache hit');
      return cached.data;
    }

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
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
const client = new CachedAPIClient();

// First call hits API
const token1 = await client.get('https://api.openpump.io/v1/tokens/MINT', API_KEY);

// Second call within 30s uses cache
const token2 = await client.get('https://api.openpump.io/v1/tokens/MINT', API_KEY);
```

### 4. Batch Requests with Delays

Space out requests to avoid bursts:

```typescript
async function batchFetch(
  mints: string[],
  apiKey: string,
  delayMs: number = 100
) {
  const results = [];

  for (const mint of mints) {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}`,
      {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      }
    );

    results.push(await response.json());

    // Delay between requests
    await sleep(delayMs);
  }

  return results;
}

// Process 100 tokens with 100ms delay = ~10 seconds total
const tokens = await batchFetch(mints, API_KEY, 100);
```

### 5. Use Request Queues

Queue requests to stay under limit:

```typescript
class RateLimitedQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerMinute: number;
  private interval: number;

  constructor(requestsPerMinute: number) {
    this.requestsPerMinute = requestsPerMinute;
    this.interval = 60000 / requestsPerMinute; // ms between requests
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

    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        await fn();
        await sleep(this.interval);
      }
    }

    this.processing = false;
  }
}

// Usage (Pro tier: 300 req/min)
const queue = new RateLimitedQueue(300);

for (const mint of mints) {
  queue.add(async () => {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}`,
      {
        headers: { 'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}` },
      }
    );
    return response.json();
  });
}
```

## Monitoring Rate Limits

### Track Usage

```typescript
class RateLimitMonitor {
  private requests = 0;
  private windowStart = Date.now();

  async fetch(url: string, apiKey: string) {
    this.requests++;

    const elapsed = Date.now() - this.windowStart;
    if (elapsed >= 60000) {
      console.log(`📊 Used ${this.requests} requests in last minute`);
      this.requests = 0;
      this.windowStart = Date.now();
    }

    return fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
  }

  getStats() {
    const elapsed = Date.now() - this.windowStart;
    const rate = (this.requests / elapsed) * 60000;

    return {
      requests: this.requests,
      elapsed,
      requestsPerMinute: Math.round(rate),
    };
  }
}

// Usage
const monitor = new RateLimitMonitor();

setInterval(() => {
  const stats = monitor.getStats();
  console.log(`Current rate: ${stats.requestsPerMinute} req/min`);
}, 10000);
```

### Alert on High Usage

```typescript
async function fetchWithAlert(
  url: string,
  apiKey: string,
  threshold: number = 0.8
) {
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
  const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
  const usage = (limit - remaining) / limit;

  if (usage >= threshold) {
    console.warn(`🚨 High rate limit usage: ${(usage * 100).toFixed(0)}%`);
    // Send alert (email, Slack, etc.)
  }

  return response;
}
```

## Optimizing for Your Tier

### Free Tier (10 req/min)

```typescript
// Poll every 6 seconds max
const POLL_INTERVAL = 10000; // 10 seconds to be safe

// Cache aggressively
const CACHE_TTL = 60000; // 1 minute

// Monitor only critical tokens
const watchlist = ['MINT1', 'MINT2']; // Max 10 tokens
```

### Starter Tier (60 req/min)

```typescript
// Poll every second
const POLL_INTERVAL = 1000;

// Moderate caching
const CACHE_TTL = 30000; // 30 seconds

// Monitor up to 60 tokens
const watchlist = [...mints]; // Up to 60
```

### Pro Tier (300 req/min)

```typescript
// Poll every 200ms
const POLL_INTERVAL = 200;

// Light caching
const CACHE_TTL = 10000; // 10 seconds

// Monitor hundreds of tokens
const watchlist = [...mints]; // 200-300 tokens
```

### Elite Tier (1000 req/min)

```typescript
// Real-time polling
const POLL_INTERVAL = 60; // ~1000 req/min

// Minimal caching
const CACHE_TTL = 5000; // 5 seconds

// Monitor everything
const watchlist = [...allMints]; // Thousands
```

## When to Upgrade

Consider upgrading when:

1. **Hitting limits regularly**: Check logs for 429 errors
2. **Need faster polling**: Lower latency requirements
3. **Growing watchlist**: More tokens to monitor
4. **Production app**: Need reliability and performance

## Cost vs Benefit

| Scenario | Tier | Cost | Requests/Day | Cost per 1M |
|----------|------|------|--------------|-------------|
| Testing | Free | $0 | 1,000 | $0 |
| Small bot | Starter | $49/mo | 10,000 | $147 |
| Trading bot | Pro | $149/mo | 100,000 | $44.70 |
| Platform | Elite | $249/mo | 1,000,000 | $7.47 |

## Need Help?

- **Upgrade tier**: [Dashboard](https://openpump.io/dashboard)
- **Request increase**: Email support@openpump.io
- **Enterprise**: Custom limits available

---

Next: [Error Handling Guide](./error-handling.md) →
