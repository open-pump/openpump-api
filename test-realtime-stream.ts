/**
 * Test script for real-time Pump.fun token launch detection
 *
 * This script connects to the OpenPump WebSocket stream and
 * displays new token launches as they are detected.
 *
 * Usage: npx tsx test-realtime-stream.ts
 */

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:4000/v1/stream';

console.log('=== OpenPump Real-Time Token Stream Test ===\n');
console.log(`Connecting to: ${WS_URL}`);

const ws = new WebSocket(WS_URL);

let tokenCount = 0;
let tradeCount = 0;

ws.on('open', () => {
  console.log('Connected to OpenPump stream!\n');
  console.log('Waiting for new token launches...\n');
  console.log('(Pump.fun launches tokens every few seconds, so wait a moment)\n');
  console.log('─'.repeat(60));
});

ws.on('message', (data: WebSocket.Data) => {
  try {
    const event = JSON.parse(data.toString());

    switch (event.type) {
      case 'connected':
        console.log(`✓ ${event.message}`);
        console.log(`  Stream Status: ${JSON.stringify(event.status)}`);
        console.log('─'.repeat(60));
        break;

      case 'new_token':
        tokenCount++;
        console.log(`\n🚀 NEW TOKEN LAUNCHED #${tokenCount}`);
        console.log(`   Mint: ${event.mint}`);
        console.log(`   Creator: ${event.creator}`);
        console.log(`   Time: ${new Date(event.timestamp).toISOString()}`);
        console.log(`   Signature: ${event.signature}`);
        console.log('─'.repeat(60));
        break;

      case 'token_enriched':
        console.log(`\n📊 TOKEN ENRICHED: ${event.mint}`);
        if (event.name) console.log(`   Name: ${event.name}`);
        if (event.symbol) console.log(`   Symbol: ${event.symbol}`);
        if (event.description) console.log(`   Description: ${event.description.substring(0, 100)}...`);
        if (event.bondingCurve) {
          console.log(`   Progress: ${event.bondingCurve.progress.toFixed(2)}%`);
          console.log(`   SOL Raised: ${event.bondingCurve.solRaised.toFixed(4)} SOL`);
          console.log(`   Current Price: ${event.bondingCurve.currentPrice.toFixed(12)} SOL`);
          console.log(`   Market Cap: ${event.bondingCurve.marketCap.toFixed(4)} SOL`);
        }
        console.log('─'.repeat(60));
        break;

      case 'buy':
      case 'sell':
        tradeCount++;
        console.log(`\n💱 TRADE #${tradeCount} - ${event.type.toUpperCase()}`);
        console.log(`   Token: ${event.mint}`);
        console.log(`   Trader: ${event.trader}`);
        console.log(`   Time: ${new Date(event.timestamp).toISOString()}`);
        break;

      case 'pong':
        console.log('Pong received');
        break;

      case 'status':
        console.log(`Status: ${JSON.stringify(event.data)}`);
        break;

      default:
        console.log('Unknown event:', event);
    }
  } catch (err) {
    console.error('Error parsing message:', err);
  }
});

ws.on('close', () => {
  console.log('\n\nConnection closed');
  console.log(`Total tokens detected: ${tokenCount}`);
  console.log(`Total trades detected: ${tradeCount}`);
  process.exit(0);
});

ws.on('error', (error: Error) => {
  console.error('WebSocket error:', error.message);
  if (error.message.includes('ECONNREFUSED')) {
    console.log('\nMake sure the OpenPump API server is running on port 4000:');
    console.log('  TEST_MODE=true PORT=4000 npm run dev');
  }
  process.exit(1);
});

// Send ping every 30 seconds to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  ws.close();
});

console.log('Press Ctrl+C to stop\n');
