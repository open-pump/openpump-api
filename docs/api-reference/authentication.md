# Authentication

Learn how to authenticate your requests to the OpenPump API.

## Overview

OpenPump uses API key authentication via the `Authorization` header. All requests must include a valid API key.

## Getting Your API Key

### 1. Sign Up

Visit [openpump.io](https://openpump.io) and create an account.

### 2. Choose a Tier

Select the tier that fits your needs:

| Tier | Price | Requests/Min | Requests/Day |
|------|-------|--------------|--------------|
| Free | $0 | 10 | 1,000 |
| Starter | $49/mo | 60 | 10,000 |
| Pro | $149/mo | 300 | 100,000 |
| Elite | $249/mo | 1,000 | 1,000,000 |

### 3. Generate API Key

1. Go to your dashboard
2. Click "Generate API Key"
3. Copy and store your key securely
4. **Never share or commit your API key!**

## Using Your API Key

### HTTP Header

Include your API key in the `Authorization` header with the `Bearer` scheme:

```http
GET /v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump HTTP/1.1
Host: api.openpump.io
Authorization: Bearer opk_1234567890abcdef
```

### cURL Example

```bash
curl https://api.openpump.io/v1/tokens/MINT_ADDRESS \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### JavaScript/TypeScript

```typescript
const OPENPUMP_API_KEY = process.env.OPENPUMP_API_KEY;

const response = await fetch('https://api.openpump.io/v1/tokens/MINT_ADDRESS', {
  headers: {
    'Authorization': `Bearer ${OPENPUMP_API_KEY}`,
  },
});

const data = await response.json();
```

### Python

```python
import os
import requests

OPENPUMP_API_KEY = os.getenv('OPENPUMP_API_KEY')

response = requests.get(
    'https://api.openpump.io/v1/tokens/MINT_ADDRESS',
    headers={'Authorization': f'Bearer {OPENPUMP_API_KEY}'}
)

data = response.json()
```

### Rust

```rust
use reqwest;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let api_key = env::var("OPENPUMP_API_KEY")?;

    let client = reqwest::Client::new();
    let response = client
        .get("https://api.openpump.io/v1/tokens/MINT_ADDRESS")
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await?;

    let data: serde_json::Value = response.json().await?;
    println!("{:?}", data);

    Ok(())
}
```

## Test Mode (Development)

For development and testing, you can enable test mode which doesn't require an API key:

### Self-Hosted

If you're self-hosting, set `TEST_MODE=true` in your `.env`:

```env
TEST_MODE=true
```

Then make requests without the `Authorization` header:

```bash
curl http://localhost:3000/v1/tokens/MINT_ADDRESS
```

### Production API

Test mode is not available on the production API. You must use a valid API key.

## API Key Format

API keys have the following format:

```
opk_[random_string]
```

- Prefix: `opk_` (OpenPump Key)
- Length: 32-40 characters
- Characters: alphanumeric

**Example**: `opk_1a2b3c4d5e6f7g8h9i0j`

## Security Best Practices

### 1. Store Keys Securely

**✅ Do:**
```bash
# Store in environment variable
export OPENPUMP_API_KEY="opk_1234567890abcdef"
```

```typescript
// Load from environment
const apiKey = process.env.OPENPUMP_API_KEY;
```

**❌ Don't:**
```typescript
// Never hardcode!
const apiKey = "opk_1234567890abcdef"; // BAD!
```

### 2. Never Commit Keys

Add `.env` to `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
```

Use `.env.example` as a template:

```env
# .env.example
OPENPUMP_API_KEY=your_api_key_here
```

### 3. Rotate Keys Regularly

Rotate your API keys every 90 days:

1. Generate new key in dashboard
2. Update environment variables
3. Test with new key
4. Revoke old key

### 4. Use Different Keys Per Environment

```env
# .env.development
OPENPUMP_API_KEY=opk_dev_1234...

# .env.production
OPENPUMP_API_KEY=opk_prod_5678...
```

### 5. Server-Side Only

**Never expose API keys in client-side code:**

```typescript
// ❌ BAD - Exposes key to browser
const apiKey = process.env.NEXT_PUBLIC_OPENPUMP_API_KEY;

// ✅ GOOD - Server-side only
export async function getServerSideProps() {
  const apiKey = process.env.OPENPUMP_API_KEY;
  // Fetch data server-side
}
```

## Error Responses

### Missing API Key

**Request:**
```bash
curl https://api.openpump.io/v1/tokens/MINT_ADDRESS
# Missing Authorization header
```

**Response:**
```json
{
  "success": false,
  "error": "Missing API key",
  "code": "MISSING_AUTH",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

**Status Code**: `401 Unauthorized`

### Invalid API Key

**Request:**
```bash
curl https://api.openpump.io/v1/tokens/MINT_ADDRESS \
  -H "Authorization: Bearer invalid_key"
```

**Response:**
```json
{
  "success": false,
  "error": "Invalid API key",
  "code": "INVALID_AUTH",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

**Status Code**: `401 Unauthorized`

### Expired API Key

**Request:**
```bash
curl https://api.openpump.io/v1/tokens/MINT_ADDRESS \
  -H "Authorization: Bearer opk_expired"
```

**Response:**
```json
{
  "success": false,
  "error": "API key expired",
  "code": "EXPIRED_AUTH",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

**Status Code**: `401 Unauthorized`

### Revoked API Key

**Response:**
```json
{
  "success": false,
  "error": "API key revoked",
  "code": "REVOKED_AUTH",
  "timestamp": "2025-11-14T10:30:00Z"
}
```

**Status Code**: `403 Forbidden`

## Rate Limiting by Tier

Each tier has different rate limits:

```http
X-RateLimit-Limit: 300      # Your tier's limit
X-RateLimit-Remaining: 285  # Requests remaining
X-RateLimit-Reset: 1700000000 # Unix timestamp for reset
```

### Free Tier
- 10 requests/minute
- 1,000 requests/day

### Starter Tier
- 60 requests/minute
- 10,000 requests/day

### Pro Tier
- 300 requests/minute
- 100,000 requests/day

### Elite Tier
- 1,000 requests/minute
- 1,000,000 requests/day

See [Rate Limits Guide](../guides/rate-limits.md) for handling rate limits.

## Managing API Keys

### View All Keys

View all your API keys in the dashboard:

```
https://openpump.io/dashboard/api-keys
```

### Revoke a Key

If a key is compromised:

1. Go to dashboard
2. Find the key
3. Click "Revoke"
4. Generate new key immediately

### Key Metadata

Each key stores metadata:

- **Created**: When the key was generated
- **Last used**: Last request timestamp
- **Requests**: Total requests made
- **Tier**: Associated pricing tier

## Upgrading/Downgrading

### Upgrade Tier

1. Go to dashboard
2. Click "Upgrade"
3. Select new tier
4. Existing keys automatically updated

### Downgrade Tier

1. Go to dashboard
2. Click "Change Plan"
3. Select lower tier
4. Keys updated at next billing cycle

## Multiple API Keys

You can have multiple API keys per account:

- **Development key** - For local testing
- **Staging key** - For staging environment
- **Production key** - For live app

Benefits:
- Separate rate limits
- Individual revocation
- Usage tracking per environment

## IP Whitelisting (Enterprise)

Enterprise customers can whitelist IP addresses:

```
Contact support@openpump.io for enterprise features
```

## Webhooks Authentication (Coming Soon)

Webhooks will use signature verification:

```http
X-OpenPump-Signature: sha256=abc123...
```

Verify the signature:

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

## Need Help?

- **Lost API Key**: Email support@openpump.io
- **Compromised Key**: Revoke immediately in dashboard
- **Rate Limit Issues**: Consider upgrading tier
- **Questions**: [Discord Community](https://discord.gg/openpump)

---

Next: [Complete Token Data](./endpoints/tokens.md) →
