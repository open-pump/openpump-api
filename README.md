# OpenPump API

The most comprehensive open-source Pump.fun intelligence API for Solana.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)

## Features

- **Real-Time WebSocket Stream** - Live token launches, buys, and sells from Pump.fun
- **Bonding Curve Analysis** - Track progress, SOL raised, reserves, and graduation status
- **Quality Scoring** - Automatic 0-100 scores to filter out low-quality tokens
- **Multi-Source Pricing** - USD and SOL prices with market cap calculations
- **Token Discovery** - Browse new, rising, and graduated tokens
- **Social Intelligence** - Auto-extracted Twitter, Telegram, and website links
- **Rate Limiting** - Tiered access control (Free, Starter, Pro, Elite)
- **Redis Caching** - High-performance response times
- **PostgreSQL Storage** - Persistent data and API key management
- **OpenAPI/Swagger Docs** - Full API documentation
- **Next.js Dashboard** - Beautiful frontend with real-time token monitoring

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (optional in TEST_MODE)
- Redis 6+ (optional in TEST_MODE)
- Helius API key (recommended) or public Solana RPC

### Installation

```bash
# Clone the repository
git clone https://github.com/openpump/openpump-api.git
cd openpump-api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

### Running in Test Mode (Quick Start)

```bash
# No database required - uses public Solana RPC
TEST_MODE=true npm run dev
```

The API will be available at `http://localhost:3000`

### Running with Full Setup

```bash
# 1. Set up PostgreSQL database
createdb openpump

# 2. Run migrations
npm run db:migrate

# 3. Seed test data (creates API keys)
npm run db:seed

# 4. Start the server
npm run dev
```

### Running the Frontend

```bash
cd web
npm install
npm run dev
```

Frontend available at `http://localhost:3002`

## API Endpoints

### Core Token Data

| Endpoint | Description |
|----------|-------------|
| `GET /v1/tokens` | List tokens with filtering and pagination |
| `GET /v1/tokens/:address` | Complete token analysis |
| `GET /v1/tokens/:address/metadata` | Token metadata with quality score |
| `GET /v1/tokens/:address/bonding` | Bonding curve metrics and progress |
| `GET /v1/tokens/:address/price` | Real-time USD and SOL pricing |

### Real-Time WebSocket

```javascript
// Connect to real-time stream (Pro/Elite tier required)
const ws = new WebSocket('ws://localhost:3000/v1/stream?api_key=YOUR_KEY');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'new_token':
      console.log('New token:', data.data.mint);
      break;
    case 'token_enriched':
      console.log('Token details:', data.name, data.symbol);
      break;
    case 'buy':
    case 'sell':
      console.log('Trade:', data.type, data.mint);
      break;
  }
};
```

### Example Response

```bash
curl http://localhost:3000/v1/tokens | jq '.data[0]'
```

```json
{
  "mint": "Dowa7gXsXWt1Sv41q1ATYbmT3yUZadu2qbHpm75Ppump",
  "name": "Same Fuck Coin",
  "symbol": "SAMEFUCK",
  "description": " ",
  "image_uri": "https://ipfs.io/ipfs/...",
  "twitter": "https://twitter.com/...",
  "telegram": null,
  "website": null,
  "creator": "4rWYQMuELvHamoFEjK9ebD9yAoprutnDtLsAN2ikKuq1",
  "price_sol": 0.00024275973240722967,
  "market_cap_sol": 222.30888405101325,
  "sol_raised": 58.399297457,
  "quality_score": 55,
  "category": "rising",
  "progress": 68.71,
  "complete": false
}
```

## API Tiers

| Tier | Price | Requests/Day | WebSocket | Best For |
|------|-------|--------------|-----------|----------|
| Free | $0 | 100 | No | Testing |
| Starter | $49/mo | 10,000 | No | Small apps |
| Pro | $149/mo | 100,000 | Yes | Growing apps |
| Elite | $249/mo | 1,000,000 | Yes | Production apps |

## Project Structure

```
openpump-api/
├── src/
│   ├── config/           # Environment configuration
│   ├── middleware/       # Auth, rate limiting, errors
│   ├── models/           # Database models
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic
│   │   ├── pumpFunService.ts      # Pump.fun data fetching
│   │   ├── bondingCurveService.ts # Bonding curve calculations
│   │   ├── pricingService.ts      # Multi-source pricing
│   │   └── realtimeTokenService.ts # WebSocket stream
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Cache, helpers
│   └── index.ts          # Main Fastify server
├── web/                  # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   │   └── realtime-token-dashboard.tsx
│   └── hooks/            # Custom React hooks
├── config/
│   └── schema.sql        # Database schema
├── docs/                 # API documentation
│   └── api-reference/
│       └── endpoints/
│           └── websocket.md  # WebSocket documentation
├── .env.example          # Environment template
├── CONTRIBUTING.md       # Contribution guidelines
├── CODE_OF_CONDUCT.md    # Community standards
├── SECURITY.md           # Security policy
└── LICENSE               # MIT License
```

## Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development
TEST_MODE=false

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/openpump

# Redis
REDIS_URL=redis://localhost:6379

# Solana RPC (Helius recommended)
SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_API_KEY=YOUR_KEY

# Rate Limits (per day)
RATE_LIMIT_FREE=100
RATE_LIMIT_STARTER=10000
RATE_LIMIT_PRO=100000
RATE_LIMIT_ELITE=1000000

# Cache TTL (seconds)
CACHE_TTL_TOKEN_METADATA=300
CACHE_TTL_TOKEN_PRICE=10
CACHE_TTL_BONDING_CURVE=30
```

## Development

### Adding New Endpoints

1. Define types in `src/types/`
2. Add validation with Zod schemas
3. Implement service logic in `src/services/`
4. Create route handler in `src/routes/`
5. Register route in `src/index.ts`
6. Add OpenAPI schema for Swagger docs
7. Write tests

### Running Tests

```bash
npm test
```

### Code Style

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- Follow existing patterns

## Deployment

### Docker

```bash
docker build -t openpump-api .
docker run -p 3000:3000 --env-file .env openpump-api
```

### Railway

```bash
railway login
railway init
railway add --database postgres
railway add --database redis
railway up
```

### Manual

```bash
npm run build
npm start
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

Found a vulnerability? Please see [SECURITY.md](./SECURITY.md) for responsible disclosure guidelines.

**Do not open public issues for security vulnerabilities.**

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- **Documentation**: `http://localhost:3000/docs` (Swagger UI)
- **Issues**: [GitHub Issues](https://github.com/openpump/openpump-api/issues)
- **Discussions**: [GitHub Discussions](https://github.com/openpump/openpump-api/discussions)
- **Email**: support@openpump.io

## Acknowledgments

- [Pump.fun](https://pump.fun) - The platform we're building intelligence for
- [Helius](https://helius.dev) - Solana RPC infrastructure
- [Solana](https://solana.com) - The blockchain powering it all

---

**Built with love for the Solana ecosystem**

