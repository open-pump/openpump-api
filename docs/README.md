# OpenPump API Documentation

Complete documentation for the OpenPump API.

## Quick Links

- **[Get Started](./guides/quick-start.md)** - 5-minute quick start guide
- **[API Reference](./api-reference/overview.md)** - Complete API documentation
- **[Code Examples](./examples/code-examples.md)** - Ready-to-use code snippets
- **[Build a Bot](./guides/building-a-bot.md)** - Complete trading bot tutorial

## Documentation Structure

### 📖 Getting Started

**[Quick Start Guide](./guides/quick-start.md)**
Get up and running with OpenPump API in 5 minutes. Includes installation, first request, and basic examples in multiple languages.

### 🔑 API Reference

**[Overview](./api-reference/overview.md)**
API architecture, request/response formats, status codes, pagination, and best practices.

**[Authentication](./api-reference/authentication.md)**
API key management, security best practices, and authentication flow.

**Endpoints:**
- [Complete Token Data](./api-reference/endpoints/tokens.md) - All token data in one request
- [Token Metadata](./api-reference/endpoints/metadata.md) - Metadata + quality scoring
- [Token Price](./api-reference/endpoints/pricing.md) - Real-time pricing data
- [Bonding Curve](./api-reference/endpoints/bonding.md) - Bonding curve metrics
- [Trade Simulation](./api-reference/endpoints/simulation.md) - Buy/sell simulation

### 📚 Guides

**[Rate Limits](./guides/rate-limits.md)**
Understanding rate limits, handling 429 errors, optimization strategies for each tier.

**[Error Handling](./guides/error-handling.md)**
Error codes, retry strategies, circuit breakers, and monitoring.

**[Building a Trading Bot](./guides/building-a-bot.md)**
Complete guide to building a production-ready pump.fun trading bot with OpenPump API.

### 💻 Examples

**[Code Examples](./examples/code-examples.md)**
Ready-to-use code snippets for:
- Basic token fetching
- Quality filtering
- Price tracking
- Trading simulation
- Advanced patterns (caching, queuing, etc.)

**[Use Cases](./examples/use-cases.md)**
Real-world applications:
- Token scanner dashboard
- Graduation alert bot
- Portfolio tracker
- Trading signal generator
- More...

## What is OpenPump?

OpenPump is the most comprehensive Pump.fun intelligence API for Solana. We provide processed, ready-to-use data that would take weeks to build yourself:

### ✨ Key Features

- **Quality Scoring (0-100)** - Automatically filter trash tokens
- **Social Link Extraction** - Auto-detect Twitter, Telegram, Discord, websites
- **Bonding Curve Intelligence** - Real-time progress, graduation tracking, price calculations
- **Token Categorization** - Automatically classify tokens (new/final-stretch/graduated)
- **Multi-Source Pricing** - Blockchain-direct bonding curve + DEX fallbacks
- **Buy/Sell Simulation** - Estimate trade outcomes before executing

### 🎯 Why Choose OpenPump?

**vs Infrastructure Providers (Helius, Alchemy):**
- We build **on top of** infrastructure to deliver processed intelligence
- They give you raw data; we give you actionable insights

**vs Generic APIs (Moralis):**
- Better pricing: $249/mo vs $299/mo
- More features: Quality scoring, social extraction, bonding curves
- More accurate: Blockchain-direct pricing
- Open source & self-hostable
- Specialized for Pump.fun

See [WHY_OPENPUMP.md](../WHY_OPENPUMP.md) for detailed comparison.

## API Tiers

| Tier | Price | Requests/Min | Requests/Day |
|------|-------|--------------|--------------|
| **Free** | $0 | 10 | 1,000 |
| **Starter** | $49/mo | 60 | 10,000 |
| **Pro** | $149/mo | 300 | 100,000 |
| **Elite** | $249/mo | 1,000 | 1,000,000 |

## Quick Example

```bash
# Get complete token data
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

## Support

- **Documentation**: You're reading it!
- **Issues**: [GitHub Issues](https://github.com/openpump/openpump-api/issues)
- **Email**: support@openpump.io
- **Discord**: [Join our community](https://discord.gg/openpump)

## Contributing

Found an error or want to improve the docs? Contributions welcome!

1. Fork the repository
2. Edit the docs
3. Submit a pull request

## License

Documentation is CC BY 4.0 Licensed.
API is MIT Licensed.

---

**Ready to start?** → [Quick Start Guide](./guides/quick-start.md)
