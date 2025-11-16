# OpenPump API Documentation

Welcome to the OpenPump API documentation. OpenPump is the most comprehensive Pump.fun intelligence API for Solana, providing real-time token analysis, bonding curve metrics, and quality scoring.

## What is OpenPump?

OpenPump is an open-source API that provides processed intelligence for Pump.fun tokens on Solana. Unlike raw infrastructure providers, we deliver ready-to-use data including:

- **Quality Scoring (0-100)** - Automatically filter low-quality tokens
- **Social Link Extraction** - Auto-detect Twitter, Telegram, Discord, websites
- **Bonding Curve Intelligence** - Real-time progress, graduation tracking, price calculations
- **Token Categorization** - Automatically classify tokens as new/final-stretch/graduated
- **Multi-Source Pricing** - Blockchain-direct bonding curve + DEX fallbacks
- **Buy/Sell Simulation** - Estimate trade outcomes before execution

## Why Choose OpenPump?

### vs Infrastructure Providers (Helius, Alchemy)
We build **on top of** infrastructure providers to deliver processed intelligence. They give you raw blockchain data; we give you actionable insights.

### vs Generic APIs (Moralis)
- **Better Pricing**: $249/mo vs $299/mo
- **More Features**: Quality scoring, social extraction, bonding curves
- **More Accurate**: Blockchain-direct pricing from bonding curves
- **Open Source**: Self-hostable, no vendor lock-in
- **Specialized**: Built specifically for Pump.fun

## Quick Start

Get started in under 5 minutes:

```bash
# Get a token's complete data
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
      "qualityScore": 75,
      "socialLinks": {
        "twitter": "https://twitter.com/gummyonsol"
      }
    },
    "price": {
      "usdPrice": 0.0000056,
      "source": "geckoterminal"
    },
    "category": "graduated"
  }
}
```

## Documentation Overview

### Getting Started
- [Quick Start Guide](./guides/quick-start.md) - Get up and running in 5 minutes
- [Authentication](./api-reference/authentication.md) - API keys and auth flow
- [Rate Limits](./guides/rate-limits.md) - Understanding usage tiers

### API Reference
- [Overview](./api-reference/overview.md) - API architecture and design
- [Tokens](./api-reference/endpoints/tokens.md) - Complete token data
- [Metadata](./api-reference/endpoints/metadata.md) - Token metadata + quality scoring
- [Pricing](./api-reference/endpoints/pricing.md) - Real-time price data
- [Bonding Curves](./api-reference/endpoints/bonding.md) - Bonding curve metrics
- [Simulation](./api-reference/endpoints/simulation.md) - Buy/sell trade simulation

### Guides
- [Building a Trading Bot](./guides/building-a-bot.md) - Complete tutorial
- [Error Handling](./guides/error-handling.md) - Handling errors gracefully
- [Caching Strategies](./guides/caching.md) - Optimize your requests

### Examples
- [Code Examples](./examples/code-examples.md) - Ready-to-use code snippets
- [Use Cases](./examples/use-cases.md) - Real-world applications

## API Tiers

| Tier | Price | Requests/Min | Requests/Day | Best For |
|------|-------|--------------|--------------|----------|
| **Free** | $0 | 10 | 1,000 | Testing & hobbyists |
| **Starter** | $49/mo | 60 | 10,000 | Small apps |
| **Pro** | $149/mo | 300 | 100,000 | Growing apps |
| **Elite** | $249/mo | 1,000 | 1,000,000 | Production apps |

## Core Endpoints

### Token Data
```
GET /v1/tokens/:address           Complete token analysis
GET /v1/tokens/:address/metadata  Metadata + quality scoring
GET /v1/tokens/:address/price     Real-time pricing
GET /v1/tokens/:address/bonding   Bonding curve metrics
```

### Trade Simulation
```
POST /v1/tokens/:address/simulate-buy   Simulate buy trade
POST /v1/tokens/:address/simulate-sell  Simulate sell trade
```

## Need Help?

- **Documentation Issues**: [GitHub Issues](https://github.com/openpump/openpump-api/issues)
- **API Support**: support@openpump.io
- **Community**: [Discord](https://discord.gg/openpump) (Coming soon)

## Open Source

OpenPump is MIT licensed and open source. You can:
- Self-host the entire stack
- Contribute features and fixes
- Build custom extensions
- Fork and modify

[View on GitHub](https://github.com/openpump/openpump-api)

---

Ready to start? Check out the [Quick Start Guide](./guides/quick-start.md) →
