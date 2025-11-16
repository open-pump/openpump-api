# Error Handling Guide

Best practices for handling errors when working with the OpenPump API.

## Error Response Format

All errors follow this consistent structure:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## HTTP Status Codes

| Code | Type | When It Happens |
|------|------|-----------------|
| **400** | Bad Request | Invalid parameters or request format |
| **401** | Unauthorized | Missing or invalid API key |
| **403** | Forbidden | Valid API key but insufficient permissions |
| **404** | Not Found | Token or resource doesn't exist |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side error (rare) |
| **503** | Service Unavailable | Temporary outage or maintenance |

## Error Codes

### Authentication Errors

#### MISSING_AUTH
```json
{
  "error": "Missing API key",
  "code": "MISSING_AUTH"
}
```

**Fix:** Add `Authorization: Bearer YOUR_API_KEY` header

#### INVALID_AUTH
```json
{
  "error": "Invalid API key",
  "code": "INVALID_AUTH"
}
```

**Fix:** Check your API key, ensure it hasn't expired

#### EXPIRED_AUTH
```json
{
  "error": "API key expired",
  "code": "EXPIRED_AUTH"
}
```

**Fix:** Generate a new API key in dashboard

#### REVOKED_AUTH
```json
{
  "error": "API key revoked",
  "code": "REVOKED_AUTH"
}
```

**Fix:** This key was manually revoked, generate a new one

### Validation Errors

#### INVALID_ADDRESS
```json
{
  "error": "Invalid token address format",
  "code": "INVALID_ADDRESS"
}
```

**Fix:** Ensure token address is valid base58-encoded Solana address

#### INVALID_AMOUNT
```json
{
  "error": "Amount must be positive",
  "code": "INVALID_AMOUNT"
}
```

**Fix:** Check amount is > 0 and reasonable

#### MISSING_REQUIRED_FIELD
```json
{
  "error": "Missing required field: amount",
  "code": "MISSING_REQUIRED_FIELD"
}
```

**Fix:** Include all required fields in request body

### Resource Errors

#### NOT_FOUND
```json
{
  "error": "Token not found",
  "code": "NOT_FOUND"
}
```

**Fix:** Verify token exists, check address is correct

#### GRADUATED
```json
{
  "error": "Token has graduated to Raydium",
  "code": "GRADUATED"
}
```

**Fix:** This is expected behavior for graduated tokens. Use price endpoint instead of bonding endpoint.

#### NO_PRICE_DATA
```json
{
  "error": "Price data unavailable",
  "code": "NO_PRICE_DATA"
}
```

**Fix:** Token is very new or has no trading activity

#### INSUFFICIENT_LIQUIDITY
```json
{
  "error": "Amount exceeds available liquidity",
  "code": "INSUFFICIENT_LIQUIDITY"
}
```

**Fix:** Reduce trade amount

### Rate Limiting Errors

#### RATE_LIMIT
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "retryAfter": 60,
  "limit": 300,
  "remaining": 0,
  "reset": 1700000000
}
```

**Fix:** Wait `retryAfter` seconds or implement rate limiting

### Server Errors

#### INTERNAL_ERROR
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

**Fix:** Retry after a delay. If persists, contact support.

#### SERVICE_UNAVAILABLE
```json
{
  "error": "Service temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "retryAfter": 300
}
```

**Fix:** Wait and retry. Likely maintenance window.

## Error Handling Patterns

### Basic Error Handling

```typescript
async function getToken(mint: string) {
  try {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.code} - ${error.error}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch token:', error);
    throw error;
  }
}
```

### Comprehensive Error Handling

```typescript
class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function fetchToken(mint: string) {
  try {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(
        error.code,
        error.error,
        response.status,
        error.retryAfter
      );
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof APIError) {
      // Handle API errors
      switch (error.code) {
        case 'NOT_FOUND':
          console.log('Token not found, may not exist or invalid address');
          return null;

        case 'RATE_LIMIT':
          console.log(`Rate limited, retry after ${error.retryAfter}s`);
          throw error;

        case 'GRADUATED':
          console.log('Token graduated, fetching DEX price instead');
          // Fallback to different endpoint
          break;

        default:
          console.error('API Error:', error.code, error.message);
          throw error;
      }
    } else {
      // Network or other errors
      console.error('Network error:', error);
      throw error;
    }
  }
}
```

### Retry with Exponential Backoff

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof APIError) {
        // Don't retry client errors (400s except 429)
        if (error.status >= 400 && error.status < 500 && error.code !== 'RATE_LIMIT') {
          throw error;
        }

        // Use server-provided retry-after for rate limits
        if (error.code === 'RATE_LIMIT' && error.retryAfter) {
          await sleep(error.retryAfter * 1000);
          continue;
        }
      }

      // Exponential backoff for other errors
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 1000; // Add jitter
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await sleep(delay + jitter);
      }
    }
  }

  throw lastError!;
}

// Usage
const token = await fetchWithRetry(() => fetchToken('MINT_ADDRESS'));
```

### Graceful Degradation

```typescript
async function getTokenData(mint: string) {
  try {
    // Try complete data first
    return await fetchCompleteToken(mint);
  } catch (error) {
    console.warn('Complete data failed, trying metadata only:', error);

    try {
      // Fallback to metadata
      const metadata = await fetchMetadata(mint);
      return { metadata, price: null, bonding: null };
    } catch (metadataError) {
      console.error('Metadata also failed:', metadataError);

      // Last resort: return minimal data
      return {
        mint,
        metadata: { name: 'Unknown', symbol: 'UNKNOWN' },
        error: 'Data unavailable',
      };
    }
  }
}
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      console.error('🔴 Circuit breaker OPEN');
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

try {
  const token = await breaker.execute(() => fetchToken('MINT'));
} catch (error) {
  if (error.message === 'Circuit breaker is OPEN') {
    // API is down, use cache or show error to user
  }
}
```

### Error Logging & Monitoring

```typescript
class ErrorTracker {
  private errors: Array<{ code: string; count: number; lastSeen: number }> = [];

  track(error: APIError) {
    const existing = this.errors.find(e => e.code === error.code);

    if (existing) {
      existing.count++;
      existing.lastSeen = Date.now();
    } else {
      this.errors.push({
        code: error.code,
        count: 1,
        lastSeen: Date.now(),
      });
    }

    // Alert if error rate is high
    if (existing && existing.count >= 10) {
      this.alert(error.code, existing.count);
    }
  }

  private alert(code: string, count: number) {
    console.error(`🚨 High error rate: ${code} occurred ${count} times`);
    // Send to monitoring service (Sentry, DataDog, etc.)
  }

  getStats() {
    return this.errors.sort((a, b) => b.count - a.count);
  }
}

// Usage
const errorTracker = new ErrorTracker();

try {
  await fetchToken('MINT');
} catch (error) {
  if (error instanceof APIError) {
    errorTracker.track(error);
  }
}

// Check stats periodically
setInterval(() => {
  const stats = errorTracker.getStats();
  console.log('Error stats:', stats);
}, 60000);
```

## Testing Error Scenarios

### Mock API Errors

```typescript
async function mockAPICall(shouldFail: boolean = false) {
  if (shouldFail) {
    throw new APIError('RATE_LIMIT', 'Rate limit exceeded', 429, 60);
  }

  return { data: { mint: 'ABC...', metadata: {} } };
}

// Test your error handling
describe('Error Handling', () => {
  it('should handle rate limits', async () => {
    try {
      await mockAPICall(true);
    } catch (error) {
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe('RATE_LIMIT');
    }
  });
});
```

## Best Practices

1. **Always check response.ok** before parsing JSON
2. **Use typed errors** for better error handling
3. **Implement retries** for transient failures
4. **Respect retry-after** headers for rate limits
5. **Log errors** for debugging and monitoring
6. **Graceful degradation** when possible
7. **Circuit breakers** to prevent cascading failures
8. **User-friendly messages** don't expose raw errors to users

## Common Pitfalls

### ❌ Don't Do This

```typescript
// No error handling
const token = await fetch(url).then(r => r.json());

// Ignoring errors
try {
  await fetch(url);
} catch {}

// Infinite retries
while (true) {
  try {
    await fetch(url);
    break;
  } catch {
    // Never breaks!
  }
}

// Exposing errors to users
catch (error) {
  showToUser(error.message); // May contain sensitive info
}
```

### ✅ Do This

```typescript
// Comprehensive error handling
try {
  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new APIError(error.code, error.error, response.status);
  }

  return await response.json();
} catch (error) {
  // Log for debugging
  console.error('API Error:', error);

  // Track for monitoring
  errorTracker.track(error);

  // Show user-friendly message
  showToUser('Unable to load token data. Please try again.');

  // Graceful degradation
  return fallbackData();
}
```

## Need Help?

- **Bug Reports**: [GitHub Issues](https://github.com/openpump/openpump-api/issues)
- **API Questions**: support@openpump.io
- **Community**: [Discord](https://discord.gg/openpump)

---

Next: [Building a Trading Bot](./building-a-bot.md) →
