const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:4000/v1/stream');

ws.on('open', () => {
  console.log('Connected to WebSocket');
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log('Received:', msg.type, msg);

  if (msg.type === 'new_token') {
    console.log('New token:', msg.data.mint.slice(0, 20) + '...');
  }
});

ws.on('error', (err) => {
  console.log('Error:', err.message);
});

ws.on('close', (code, reason) => {
  console.log('Closed:', code, reason.toString());
  process.exit(0);
});

// Close after 10 seconds
setTimeout(() => {
  console.log('Test complete - closing');
  ws.close();
}, 10000);
