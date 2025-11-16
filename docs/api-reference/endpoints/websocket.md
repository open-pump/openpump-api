# WebSocket Real-Time Stream

> **Pro/Enterprise Plan Only** - Real-time streaming is available exclusively for paid plans.

Connect to the OpenPump WebSocket stream to receive real-time notifications of new token launches on Pump.fun. This endpoint provides sub-second detection of new tokens as they are created on-chain.

## Connection

```
ws://api.openpump.io/v1/stream
```

### Authentication

Include your API key as a query parameter:

```
ws://api.openpump.io/v1/stream?api_key=YOUR_API_KEY
```

Or via WebSocket headers (for supported clients):
```javascript
const ws = new WebSocket('ws://api.openpump.io/v1/stream', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
```

## Event Types

### Connection Established

Upon successful connection, you'll receive:

```json
{
  "type": "connected",
  "message": "Connected to OpenPump real-time stream",
  "timestamp": 1700000000000,
  "status": {
    "running": true,
    "subscriptionId": 12345,
    "processedCount": 50000
  }
}
```

### New Token Launch

Emitted immediately when a new token is detected (within seconds of on-chain creation):

```json
{
  "type": "new_token",
  "timestamp": 1700000001000,
  "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "signature": "5uEezmZnrgk3a1g92qQ3CmbkjtE7j5xV2rbFy43Lt8WeT1MPRjqNLK7g9hzQHZv6kxxLeyujDdX6K69A9LhVpnNa",
  "creator": "7nE9GvcwsqzYxmJLSrYmSB1V1YoJWVK1KWzAcWAzjXkN"
}
```

### Token Enriched

Sent shortly after `new_token` with additional metadata:

```json
{
  "type": "token_enriched",
  "timestamp": 1700000001000,
  "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "signature": "5uEezmZnrgk3a1g92qQ3CmbkjtE7j5xV2rbFy43Lt8WeT1MPRjqNLK7g9hzQHZv6kxxLeyujDdX6K69A9LhVpnNa",
  "creator": "7nE9GvcwsqzYxmJLSrYmSB1V1YoJWVK1KWzAcWAzjXkN",
  "name": "Example Token",
  "symbol": "EXMP",
  "description": "An example token for demonstration",
  "image": "https://ipfs.io/ipfs/QmXxxx...",
  "bondingCurve": {
    "progress": 0.15,
    "solRaised": 1.234,
    "currentPrice": 0.000000012345,
    "marketCap": 12.345
  }
}
```

### Trade Event (Optional)

If subscribed to trade events:

```json
{
  "type": "buy",
  "timestamp": 1700000002000,
  "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "signature": "3wXXXXXX...",
  "trader": "9aXXXXXX...",
  "solAmount": 0.5,
  "tokenAmount": 1000000
}
```

## Client Messages

### Ping/Pong

Keep the connection alive with periodic pings:

```json
// Client sends:
{ "type": "ping" }

// Server responds:
{ "type": "pong", "timestamp": 1700000000000 }
```

### Status Request

Request current stream status:

```json
// Client sends:
{ "type": "status" }

// Server responds:
{
  "type": "status",
  "data": {
    "running": true,
    "subscriptionId": 12345,
    "processedCount": 50000
  },
  "timestamp": 1700000000000
}
```

## JavaScript Example

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://api.openpump.io/v1/stream?api_key=YOUR_API_KEY');

ws.on('open', () => {
  console.log('Connected to OpenPump stream');
});

ws.on('message', (data) => {
  const event = JSON.parse(data);

  switch (event.type) {
    case 'new_token':
      console.log(`NEW TOKEN: ${event.mint}`);
      // React quickly - this is a brand new token!
      break;

    case 'token_enriched':
      console.log(`Token ${event.symbol}: ${event.name}`);
      console.log(`Progress: ${event.bondingCurve?.progress}%`);
      console.log(`Market Cap: ${event.bondingCurve?.marketCap} SOL`);
      break;

    case 'buy':
    case 'sell':
      console.log(`${event.type.toUpperCase()}: ${event.solAmount} SOL`);
      break;
  }
});

// Send ping every 30 seconds to keep connection alive
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);

ws.on('close', () => {
  console.log('Disconnected - implement reconnection logic');
});
```

## React/Browser Example

```typescript
import { useEffect, useState, useRef } from 'react';

interface TokenEvent {
  type: 'new_token' | 'token_enriched';
  mint: string;
  name?: string;
  symbol?: string;
  bondingCurve?: {
    progress: number;
    solRaised: number;
  };
}

export function useTokenStream() {
  const [tokens, setTokens] = useState<TokenEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://api.openpump.io/v1/stream?api_key=YOUR_KEY');
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'new_token') {
          setTokens(prev => [data, ...prev].slice(0, 50));
        } else if (data.type === 'token_enriched') {
          setTokens(prev =>
            prev.map(t => t.mint === data.mint ? { ...t, ...data } : t)
          );
        }
      };

      ws.onclose = () => {
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => wsRef.current?.close();
  }, []);

  return tokens;
}
```

## Python Example

```python
import asyncio
import websockets
import json

async def stream_tokens():
    uri = "ws://api.openpump.io/v1/stream?api_key=YOUR_API_KEY"

    async with websockets.connect(uri) as websocket:
        print("Connected to OpenPump stream")

        async for message in websocket:
            event = json.loads(message)

            if event["type"] == "new_token":
                print(f"NEW TOKEN: {event['mint']}")
                # Execute trading logic here

            elif event["type"] == "token_enriched":
                print(f"Token: {event.get('name', 'Unknown')}")
                if "bondingCurve" in event:
                    print(f"Progress: {event['bondingCurve']['progress']}%")

asyncio.run(stream_tokens())
```

## Rate Limits

| Plan | Max Concurrent Connections | Events/Minute |
|------|---------------------------|---------------|
| Pro | 2 | Unlimited |
| Enterprise | 10 | Unlimited |

## Best Practices

1. **Implement Reconnection Logic** - WebSocket connections can drop; always reconnect automatically.

2. **Act Fast on `new_token`** - This event fires within seconds of on-chain creation. If you're a trading bot, this is your signal.

3. **Use `token_enriched` for Details** - Wait for this event to get name, symbol, and bonding curve data before making informed decisions.

4. **Send Periodic Pings** - Keep the connection alive by sending pings every 30 seconds.

5. **Handle High Volume** - Pump.fun can launch 10+ tokens per minute. Ensure your handler can process events quickly.

## Error Handling

The WebSocket connection may close with these codes:

- `1000` - Normal closure
- `1001` - Server going away (maintenance)
- `1008` - Policy violation (invalid API key)
- `1011` - Server error (temporary, reconnect)
- `4001` - Plan restriction (upgrade required)

Always implement exponential backoff for reconnection:

```javascript
let reconnectAttempts = 0;

function reconnect() {
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
  setTimeout(() => {
    reconnectAttempts++;
    connect();
  }, delay);
}
```
