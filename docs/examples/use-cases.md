# Real-World Use Cases

Examples of applications built with OpenPump API.

## 1. Token Scanner Dashboard

**Goal:** Display newly launched pump.fun tokens with quality filtering.

**Features:**
- Real-time token discovery
- Quality score filtering
- Social link verification
- Price and bonding curve metrics

**Tech Stack:** Next.js, TailwindCSS, OpenPump API

**Implementation:**

```typescript
// app/scanner/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface Token {
  mint: string;
  name: string;
  symbol: string;
  qualityScore: number;
  category: string;
  price: number;
  twitter?: string;
}

export default function TokenScanner() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [minScore, setMinScore] = useState(70);

  useEffect(() => {
    async function fetchTokens() {
      // In production, you'd fetch a list of recent tokens
      const mints = await getRecentMints();

      const tokenData = await Promise.all(
        mints.map(async (mint) => {
          const response = await fetch(`/api/tokens/${mint}`);
          return response.json();
        })
      );

      const filtered = tokenData
        .filter(t => t.metadata.qualityScore >= minScore)
        .filter(t => t.metadata.hasSocial);

      setTokens(filtered);
    }

    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);

    return () => clearInterval(interval);
  }, [minScore]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Token Scanner</h1>

      <div className="mb-4">
        <label>
          Min Quality Score: {minScore}
          <input
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="ml-2"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map((token) => (
          <div key={token.mint} className="border rounded-lg p-4">
            <h2 className="font-bold">{token.name} ({token.symbol})</h2>
            <p>Quality: {token.qualityScore}/100</p>
            <p>Category: {token.category}</p>
            <p>Price: ${token.price?.toFixed(8)}</p>
            {token.twitter && (
              <a href={token.twitter} className="text-blue-500">
                Twitter
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// app/api/tokens/[mint]/route.ts
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { mint: string } }
) {
  const response = await fetch(
    `https://api.openpump.io/v1/tokens/${params.mint}`,
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
      },
    }
  );

  const data = await response.json();
  return NextResponse.json(data.data);
}
```

---

## 2. Graduation Alert Bot

**Goal:** Alert users when tokens are close to graduating.

**Features:**
- Monitor bonding curve progress
- Alert at 80%, 90%, 95%, 99%
- Send notifications via Telegram/Discord/Email

**Tech Stack:** Node.js, Bull queue, Telegram Bot API

**Implementation:**

```typescript
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: true });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

class GraduationMonitor {
  private watchlist = new Map<string, number>(); // mint -> last progress

  async monitor(mint: string) {
    this.watchlist.set(mint, 0);

    const check = async () => {
      try {
        const response = await fetch(
          `https://api.openpump.io/v1/tokens/${mint}/bonding`,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          // Token graduated
          await this.sendAlert(mint, 'graduated');
          this.watchlist.delete(mint);
          return;
        }

        const { data } = await response.json();
        const lastProgress = this.watchlist.get(mint) || 0;

        // Alert at milestones
        const milestones = [80, 90, 95, 99];

        for (const milestone of milestones) {
          if (data.progress >= milestone && lastProgress < milestone) {
            await this.sendAlert(mint, `${milestone}%`, data);
          }
        }

        this.watchlist.set(mint, data.progress);
      } catch (error) {
        console.error(`Error monitoring ${mint}:`, error);
      }
    };

    // Check every 30 seconds
    setInterval(check, 30000);
    check(); // Initial check
  }

  private async sendAlert(mint: string, status: string, data?: any) {
    let message = '';

    if (status === 'graduated') {
      message = `🎓 Token ${mint} has graduated!`;
    } else {
      message = `🚀 Token ${mint} reached ${status} progress!\n`;
      message += `SOL Raised: ${data.solRaised.toFixed(2)} / 85\n`;
      message += `Remaining: ${data.solRemaining.toFixed(2)} SOL\n`;
      message += `Current Price: $${data.priceInUsd.toFixed(8)}`;
    }

    await bot.sendMessage(CHAT_ID, message);
  }
}

// Usage
const monitor = new GraduationMonitor();

// Add tokens to watch
const tokensToWatch = ['MINT1', 'MINT2', 'MINT3'];
tokensToWatch.forEach(mint => monitor.monitor(mint));
```

---

## 3. Portfolio Tracker

**Goal:** Track token holdings and P&L.

**Features:**
- Real-time portfolio value
- P&L tracking
- Historical performance
- Alerts for price changes

**Tech Stack:** React, Chart.js, OpenPump API

**Implementation:**

```typescript
// PortfolioTracker.tsx
import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

interface Holding {
  mint: string;
  name: string;
  symbol: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
  pnlPercent: number;
}

export function PortfolioTracker() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);

  useEffect(() => {
    async function updatePortfolio() {
      // Load holdings from local storage or database
      const savedHoldings = JSON.parse(
        localStorage.getItem('holdings') || '[]'
      );

      const updated = await Promise.all(
        savedHoldings.map(async (h: any) => {
          const response = await fetch(`/api/tokens/${h.mint}`);
          const token = await response.json();

          const currentPrice = token.price.usdPrice;
          const value = currentPrice * h.amount;
          const cost = h.avgBuyPrice * h.amount;
          const pnl = value - cost;
          const pnlPercent = (pnl / cost) * 100;

          return {
            mint: h.mint,
            name: token.metadata.name,
            symbol: token.metadata.symbol,
            amount: h.amount,
            avgBuyPrice: h.avgBuyPrice,
            currentPrice,
            value,
            pnl,
            pnlPercent,
          };
        })
      );

      setHoldings(updated);
      setTotalValue(updated.reduce((sum, h) => sum + h.value, 0));
      setTotalPnL(updated.reduce((sum, h) => sum + h.pnl, 0));
    }

    updatePortfolio();
    const interval = setInterval(updatePortfolio, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Portfolio</h1>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold">Total Value</h2>
          <p className="text-2xl">${totalValue.toFixed(2)}</p>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold">Total P&L</h2>
          <p
            className={`text-2xl ${
              totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            ${totalPnL.toFixed(2)}
          </p>
        </div>
      </div>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Token</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Avg Buy</th>
            <th className="p-2">Current</th>
            <th className="p-2">Value</th>
            <th className="p-2">P&L</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.mint} className="border-t">
              <td className="p-2">
                {h.name} ({h.symbol})
              </td>
              <td className="p-2">{h.amount.toLocaleString()}</td>
              <td className="p-2">${h.avgBuyPrice.toFixed(8)}</td>
              <td className="p-2">${h.currentPrice.toFixed(8)}</td>
              <td className="p-2">${h.value.toFixed(2)}</td>
              <td
                className={`p-2 ${
                  h.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                ${h.pnl.toFixed(2)} ({h.pnlPercent > 0 ? '+' : ''}
                {h.pnlPercent.toFixed(2)}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 4. Trading Signal Bot

**Goal:** Generate buy/sell signals based on token metrics.

**Features:**
- Quality-based filtering
- Bonding curve analysis
- Price momentum detection
- Automated signal generation

**Implementation:**

```typescript
interface Signal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
}

class SignalGenerator {
  async analyze(mint: string): Promise<Signal> {
    const response = await fetch(
      `https://api.openpump.io/v1/tokens/${mint}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENPUMP_API_KEY}`,
        },
      }
    );

    const { data: token } = await response.json();

    const reasons: string[] = [];
    let score = 0;

    // Quality check (30 points)
    if (token.metadata.qualityScore > 80) {
      score += 30;
      reasons.push('High quality score (>80)');
    } else if (token.metadata.qualityScore > 60) {
      score += 15;
      reasons.push('Good quality score (>60)');
    }

    // Social presence (20 points)
    if (token.metadata.hasSocial) {
      const socialCount = Object.values(token.metadata.socialLinks).filter(
        Boolean
      ).length;

      if (socialCount >= 2) {
        score += 20;
        reasons.push('Multiple social links');
      } else {
        score += 10;
        reasons.push('Has social link');
      }
    }

    // Bonding status (30 points)
    if (token.bonding) {
      if (
        token.bonding.category === 'final-stretch' &&
        token.bonding.progress > 85
      ) {
        score += 30;
        reasons.push('Final stretch, high progress');
      } else if (token.bonding.category === 'final-stretch') {
        score += 20;
        reasons.push('Final stretch phase');
      } else if (token.bonding.progress < 50) {
        score += 15;
        reasons.push('Early phase, good entry');
      }
    }

    // Price momentum (20 points)
    if (token.price?.priceChange24h) {
      if (token.price.priceChange24h > 100) {
        score += 20;
        reasons.push('Strong price momentum (>100%)');
      } else if (token.price.priceChange24h > 50) {
        score += 10;
        reasons.push('Good price momentum (>50%)');
      }
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

// Usage
const generator = new SignalGenerator();

const signal = await generator.analyze('MINT_ADDRESS');

console.log(`Action: ${signal.action}`);
console.log(`Confidence: ${signal.confidence}%`);
console.log(`Reasons:`);
signal.reasons.forEach(r => console.log(`- ${r}`));
```

---

## 5. Sniper Bot

**Goal:** Detect and buy high-quality tokens early.

**Features:**
- Real-time new token detection
- Instant quality analysis
- Automated buying
- Risk management

**Warning:** Sniper bots carry high risk. Only use for educational purposes.

---

## More Ideas

### Analytics Platform
- Historical data tracking
- Performance metrics
- Market trends
- Token correlations

### Social Monitoring
- Track Twitter mentions
- Telegram activity
- Sentiment analysis
- Community growth

### Risk Management Tool
- Position sizing calculator
- Stop loss / take profit automation
- Portfolio rebalancing
- Drawdown tracking

### Discord/Telegram Bot
- Token lookup commands
- Price alerts
- Graduation notifications
- Quality score checks

---

Have a cool use case? Share it on [Discord](https://discord.gg/openpump) →
