# Token Metadata

Get token metadata with quality scoring and social link extraction.

## Endpoint

```
GET /v1/tokens/:address/metadata
```

## Description

Returns token metadata including name, symbol, description, image, creator, quality scoring (0-100), and automatically extracted social links.

**Use this when:** You only need metadata and quality scoring, not price or bonding data.

## Request

```bash
curl https://api.openpump.io/v1/tokens/E2TvuzKaibxDB7qBLAuEkc7qwD187MeqiKL9Gu8rpump/metadata \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Response

```json
{
  "success": true,
  "data": {
    "name": "Gummy",
    "symbol": "GUMMY",
    "description": "First memecoin cat on Solana. Twitter: https://twitter.com/gummyonsol",
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
  "timestamp": "2025-11-14T10:30:00Z"
}
```

## Quality Scoring

Quality scores range from 0-100 based on metadata completeness:

| Component | Points | Criteria |
|-----------|--------|----------|
| Has Name | 10 | Token has a name |
| Has Symbol | 10 | Token has a symbol/ticker |
| Has Description | 15 | Token has a description (>20 chars) |
| Has Image | 15 | Token has an image |
| Has Social Links | 10 | Has at least one social link |
| Has Website | 5 | Has a website link |
| Has Creator | 10 | Creator address available |
| Description Quality | 10 | Description >100 chars |
| Image Quality | 10 | Image loads successfully |
| Multiple Socials | 5 | Has 2+ social links |

**Total:** 100 points

### Quality Thresholds

- **0-30**: Low quality (likely spam/scam)
- **31-50**: Medium quality (incomplete)
- **51-70**: Good quality (usable)
- **71-100**: High quality (complete and professional)

## Social Link Extraction

Social links are automatically extracted from the description using pattern matching:

### Supported Platforms

| Platform | Patterns |
|----------|----------|
| Twitter | `twitter.com/`, `x.com/`, `@username` |
| Telegram | `t.me/`, `telegram.me/` |
| Discord | `discord.gg/`, `discord.com/invite/` |
| Website | `http://`, `https://` (not social) |

### Example Descriptions

```text
"First memecoin cat on Solana
Twitter: https://twitter.com/gummyonsol
Telegram: https://t.me/gummychat
Website: https://gummy.com"
```

**Extracted:**
```json
{
  "twitter": "https://twitter.com/gummyonsol",
  "telegram": "https://t.me/gummychat",
  "website": "https://gummy.com",
  "discord": null
}
```

## Code Examples

### Filter by Quality

```typescript
async function getHighQualityTokens(mints: string[]) {
  const highQuality = [];

  for (const mint of mints) {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}/metadata`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    const { data } = await response.json();

    if (data.qualityScore > 70) {
      highQuality.push({
        mint,
        name: data.name,
        score: data.qualityScore,
        socials: data.socialLinks,
      });
    }
  }

  return highQuality;
}
```

### Verify Social Links

```typescript
async function verifySocialPresence(mint: string) {
  const response = await fetch(
    `https://api.openpump.io/v1/tokens/${mint}/metadata`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
      },
    }
  );

  const { data } = await response.json();

  const verification = {
    hasTwitter: !!data.socialLinks.twitter,
    hasTelegram: !!data.socialLinks.telegram,
    hasDiscord: !!data.socialLinks.discord,
    hasWebsite: !!data.socialLinks.website,
    totalLinks: Object.values(data.socialLinks).filter(Boolean).length,
  };

  return verification;
}
```

## Performance

- **Uncached**: ~670ms (IPFS fetch + parsing)
- **Cached**: ~15ms
- **Cache TTL**: 5 minutes

## Related Endpoints

- [Complete Token Data](./tokens.md) - All data in one request
- [Token Price](./pricing.md) - Price data only
- [Bonding Curve](./bonding.md) - Bonding curve data only

---

Next: [Token Price](./pricing.md) →
