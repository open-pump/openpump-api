# Building a Trading Bot

Complete guide to building a pump.fun trading bot using OpenPump API.

## Overview

This guide walks through building a production-ready trading bot that:
- Monitors pump.fun tokens
- Filters by quality score
- Detects final-stretch opportunities
- Simulates trades before executing
- Manages risk and position sizing

## Prerequisites

- Node.js 18+ or Python 3.9+
- OpenPump API key (Pro or Elite tier recommended)
- Solana wallet with SOL
- Basic understanding of TypeScript/Python
- Trading knowledge

## Architecture

```
Bot Architecture:
┌─────────────────┐
│  Token Scanner  │ → Scan new tokens
└────────┬────────┘
         │
┌────────▼────────┐
│ Quality Filter  │ → Filter by score > 70
└────────┬────────┘
         │
┌────────▼────────┐
│ Signal Generator│ → Detect opportunities
└────────┬────────┘
         │
┌────────▼────────┐
│ Risk Manager    │ → Position sizing
└────────┬────────┘
         │
┌────────▼────────┐
│ Trade Executor  │ → Execute trades
└─────────────────┘
```

## Step 1: Setup

### TypeScript

```bash
mkdir pump-bot && cd pump-bot
npm init -y
npm install dotenv @solana/web3.js
npm install -D typescript @types/node tsx

# Create .env
echo "OPENPUMP_API_KEY=your_api_key" >> .env
echo "SOLANA_RPC_URL=your_helius_rpc" >> .env
echo "WALLET_PRIVATE_KEY=your_wallet_key" >> .env
```

### Python

```bash
mkdir pump-bot && cd pump-bot
python -m venv venv
source venv/bin/activate
pip install requests python-dotenv solana

# Create .env
echo "OPENPUMP_API_KEY=your_api_key" >> .env
echo "SOLANA_RPC_URL=your_helius_rpc" >> .env
echo "WALLET_PRIVATE_KEY=your_wallet_key" >> .env
```

## Step 2: API Client

### TypeScript

```typescript
// src/api-client.ts
import 'dotenv/config';

const API_BASE = 'https://api.openpump.io/v1';
const API_KEY = process.env.OPENPUMP_API_KEY!;

export class OpenPumpClient {
  private async fetch(path: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.code} - ${error.error}`);
    }

    return response.json();
  }

  async getToken(mint: string) {
    const result = await this.fetch(`/tokens/${mint}`);
    return result.data;
  }

  async simulateBuy(mint: string, amount: number) {
    const result = await this.fetch(`/tokens/${mint}/simulate-buy`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return result.data;
  }

  async simulateSell(mint: string, amount: number) {
    const result = await this.fetch(`/tokens/${mint}/simulate-sell`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    return result.data;
  }
}
```

## Step 3: Quality Filter

```typescript
// src/filters.ts
export interface FilterConfig {
  minQualityScore: number;
  requireSocials: boolean;
  allowedCategories: string[];
  minProgress?: number;
  maxProgress?: number;
}

export class TokenFilter {
  constructor(private config: FilterConfig) {}

  passes(token: any): boolean {
    // Quality score
    if (token.metadata.qualityScore < this.config.minQualityScore) {
      return false;
    }

    // Social links
    if (this.config.requireSocials && !token.metadata.hasSocial) {
      return false;
    }

    // Category
    if (!this.config.allowedCategories.includes(token.category)) {
      return false;
    }

    // Bonding progress
    if (token.bonding) {
      if (this.config.minProgress && token.bonding.progress < this.config.minProgress) {
        return false;
      }
      if (this.config.maxProgress && token.bonding.progress > this.config.maxProgress) {
        return false;
      }
    }

    return true;
  }
}

// Usage
const filter = new TokenFilter({
  minQualityScore: 70,
  requireSocials: true,
  allowedCategories: ['final-stretch'],
  minProgress: 80,
  maxProgress: 95,
});
```

## Step 4: Signal Generator

```typescript
// src/signals.ts
export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
}

export class SignalGenerator {
  generate(token: any): TradingSignal {
    const reasons: string[] = [];
    let score = 0;

    // High quality
    if (token.metadata.qualityScore > 80) {
      score += 25;
      reasons.push('High quality score');
    }

    // Has socials
    if (token.metadata.hasSocial) {
      score += 15;
      reasons.push('Has social links');
    }

    // Final stretch
    if (token.bonding?.category === 'final-stretch') {
      score += 30;
      reasons.push('Final stretch to graduation');
    }

    // Price momentum
    if (token.price?.priceChange24h > 50) {
      score += 20;
      reasons.push('Strong price momentum');
    }

    // Low progress (avoid late entry)
    if (token.bonding && token.bonding.progress < 90) {
      score += 10;
      reasons.push('Early enough entry');
    }

    // Determine action
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    if (score >= 70) {
      action = 'BUY';
    } else if (score < 30) {
      action = 'SELL';
    }

    return {
      action,
      confidence: score,
      reasons,
    };
  }
}
```

## Step 5: Risk Management

```typescript
// src/risk-manager.ts
export interface RiskConfig {
  maxPositionSize: number; // Max SOL per trade
  maxPortfolioRisk: number; // Max % of portfolio
  maxPriceImpact: number; // Max price impact %
  stopLoss: number; // Stop loss %
  takeProfit: number; // Take profit %
}

export class RiskManager {
  constructor(
    private config: RiskConfig,
    private portfolioValue: number
  ) {}

  calculatePositionSize(
    signal: TradingSignal,
    currentPrice: number
  ): number {
    // Base position size on confidence
    const baseSize = this.config.maxPositionSize * (signal.confidence / 100);

    // Limit to portfolio risk
    const maxFromPortfolio = this.portfolioValue * (this.config.maxPortfolioRisk / 100);

    return Math.min(baseSize, maxFromPortfolio);
  }

  async validateTrade(
    client: OpenPumpClient,
    mint: string,
    amount: number
  ): Promise<boolean> {
    // Simulate trade
    const simulation = await client.simulateBuy(mint, amount);

    // Check price impact
    if (simulation.priceImpact > this.config.maxPriceImpact) {
      console.log(`❌ Price impact too high: ${simulation.priceImpact}%`);
      return false;
    }

    // Check slippage
    if (simulation.slippage > 5) {
      console.log(`❌ Slippage too high: ${simulation.slippage}%`);
      return false;
    }

    return true;
  }

  shouldStopLoss(entryPrice: number, currentPrice: number): boolean {
    const loss = ((currentPrice - entryPrice) / entryPrice) * 100;
    return loss <= -this.config.stopLoss;
  }

  shouldTakeProfit(entryPrice: number, currentPrice: number): boolean {
    const profit = ((currentPrice - entryPrice) / entryPrice) * 100;
    return profit >= this.config.takeProfit;
  }
}
```

## Step 6: Trading Bot

```typescript
// src/bot.ts
import { OpenPumpClient } from './api-client';
import { TokenFilter } from './filters';
import { SignalGenerator } from './signals';
import { RiskManager } from './risk-manager';

export class TradingBot {
  private client: OpenPumpClient;
  private filter: TokenFilter;
  private signalGenerator: SignalGenerator;
  private riskManager: RiskManager;
  private watchlist: string[] = [];
  private positions: Map<string, any> = new Map();

  constructor() {
    this.client = new OpenPumpClient();

    this.filter = new TokenFilter({
      minQualityScore: 70,
      requireSocials: true,
      allowedCategories: ['final-stretch'],
      minProgress: 75,
      maxProgress: 95,
    });

    this.signalGenerator = new SignalGenerator();

    this.riskManager = new RiskManager(
      {
        maxPositionSize: 0.5, // 0.5 SOL max per trade
        maxPortfolioRisk: 5, // 5% of portfolio per trade
        maxPriceImpact: 3, // 3% max price impact
        stopLoss: 10, // 10% stop loss
        takeProfit: 50, // 50% take profit
      },
      10 // 10 SOL total portfolio
    );
  }

  async scanToken(mint: string) {
    try {
      // Fetch token data
      const token = await this.client.getToken(mint);

      // Apply filter
      if (!this.filter.passes(token)) {
        return;
      }

      console.log(`✅ Token passed filter: ${token.metadata.name}`);

      // Generate signal
      const signal = this.signalGenerator.generate(token);

      console.log(`Signal: ${signal.action} (confidence: ${signal.confidence}%)`);
      console.log(`Reasons: ${signal.reasons.join(', ')}`);

      // Execute based on signal
      if (signal.action === 'BUY') {
        await this.executeBuy(mint, token, signal);
      } else if (signal.action === 'SELL' && this.positions.has(mint)) {
        await this.executeSell(mint, token);
      }
    } catch (error) {
      console.error(`Error scanning ${mint}:`, error);
    }
  }

  private async executeBuy(mint: string, token: any, signal: any) {
    // Calculate position size
    const amount = this.riskManager.calculatePositionSize(
      signal,
      token.price.usdPrice
    );

    console.log(`📊 Position size: ${amount} SOL`);

    // Validate trade
    const isValid = await this.riskManager.validateTrade(
      this.client,
      mint,
      amount
    );

    if (!isValid) {
      console.log('❌ Trade validation failed');
      return;
    }

    console.log(`🚀 Executing BUY: ${amount} SOL of ${token.metadata.name}`);

    // Execute trade (implement with Solana web3.js)
    // await this.executeOnChain(mint, amount);

    // Track position
    this.positions.set(mint, {
      entryPrice: token.price.usdPrice,
      amount,
      timestamp: Date.now(),
    });
  }

  private async executeSell(mint: string, token: any) {
    const position = this.positions.get(mint);

    if (!position) return;

    // Check stop loss / take profit
    const shouldExit =
      this.riskManager.shouldStopLoss(position.entryPrice, token.price.usdPrice) ||
      this.riskManager.shouldTakeProfit(position.entryPrice, token.price.usdPrice);

    if (shouldExit) {
      console.log(`🚀 Executing SELL: ${token.metadata.name}`);

      // Execute sell (implement with Solana web3.js)
      // await this.sellOnChain(mint, position.amount);

      this.positions.delete(mint);
    }
  }

  async monitorPositions() {
    for (const [mint, position] of this.positions) {
      const token = await this.client.getToken(mint);

      const pnl = ((token.price.usdPrice - position.entryPrice) / position.entryPrice) * 100;

      console.log(`${token.metadata.name}: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%`);

      // Check exit conditions
      await this.executeSell(mint, token);
    }
  }

  async run() {
    console.log('🤖 Trading bot started');

    // Main loop
    setInterval(async () => {
      // Scan watchlist
      for (const mint of this.watchlist) {
        await this.scanToken(mint);
      }

      // Monitor positions
      await this.monitorPositions();
    }, 30000); // Every 30 seconds
  }

  addToWatchlist(mint: string) {
    this.watchlist.push(mint);
  }
}

// Usage
const bot = new TradingBot();
bot.addToWatchlist('TOKEN_MINT_1');
bot.addToWatchlist('TOKEN_MINT_2');
bot.run();
```

## Step 7: On-Chain Execution (Bonus)

```typescript
// src/executor.ts
import { Connection, Keypair, PublicKey } from '@solana/web3.js';

export class TradeExecutor {
  private connection: Connection;
  private wallet: Keypair;

  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL!);
    // Load wallet from private key
    this.wallet = Keypair.fromSecretKey(
      Buffer.from(process.env.WALLET_PRIVATE_KEY!, 'base64')
    );
  }

  async executeBuy(mint: string, solAmount: number) {
    // Implement Pump.fun buy instruction
    // This requires the Pump.fun program IDL and instruction builders
    console.log(`Executing buy of ${mint} for ${solAmount} SOL`);
    // Implementation details omitted for brevity
  }

  async executeSell(mint: string, tokenAmount: number) {
    // Implement Pump.fun sell instruction
    console.log(`Executing sell of ${tokenAmount} tokens of ${mint}`);
    // Implementation details omitted for brevity
  }
}
```

## Best Practices

### 1. Start Small
- Test with small amounts (0.01-0.1 SOL)
- Run in paper trading mode first
- Gradually increase position sizes

### 2. Monitor and Log
- Log all trades and decisions
- Track win rate and P&L
- Monitor API usage and rate limits

### 3. Risk Management
- Never risk more than 1-5% per trade
- Use stop losses
- Diversify across multiple tokens

### 4. Stay Updated
- Monitor pump.fun for new features
- Update bot logic based on market conditions
- Join OpenPump Discord for updates

## Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["node", "dist/bot.js"]
```

### PM2

```bash
npm install -g pm2
pm2 start dist/bot.js --name pump-bot
pm2 save
pm2 startup
```

## Monitoring

### Set Up Alerts

```typescript
// Send alerts via webhook, email, or Telegram
async function sendAlert(message: string) {
  await fetch(process.env.WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify({ text: message }),
  });
}

// Use in bot
if (signal.action === 'BUY') {
  await sendAlert(`🚀 Buying ${token.metadata.name}`);
}
```

## Legal Disclaimer

This guide is for educational purposes only. Trading cryptocurrencies carries risk. Always:
- Do your own research
- Never invest more than you can afford to lose
- Comply with local regulations
- Test thoroughly before going live

## Need Help?

- **Bot Questions**: [Discord](https://discord.gg/openpump)
- **API Issues**: support@openpump.io
- **Examples**: [Code Examples](../examples/code-examples.md)

---

Ready for examples? Check out [Code Examples](../examples/code-examples.md) →
