#!/bin/bash

# OpenPump API Test Script
# Test the core token endpoints with a real pump.fun token

API_URL="http://localhost:3000"
# Example pump.fun token (replace with a recent one)
TOKEN_MINT="pump"

echo "🧪 Testing OpenPump API"
echo "========================"
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s $API_URL/health | jq .
echo ""

# Test root endpoint
echo "2. Testing root endpoint..."
curl -s $API_URL/ | jq .
echo ""

# Test token endpoints (will fail without auth, but shows the endpoints work)
echo "3. Testing /v1/tokens/:address (without auth - should fail)..."
curl -s $API_URL/v1/tokens/$TOKEN_MINT | jq .
echo ""

echo "Done! ✅"
echo ""
echo "To test with authentication:"
echo "1. Run: npm run db:migrate"
echo "2. Run: npm run db:seed (this creates test API keys)"
echo "3. Use the generated API key:"
echo "   curl -H 'Authorization: Bearer YOUR_API_KEY' $API_URL/v1/tokens/MINT_ADDRESS"
