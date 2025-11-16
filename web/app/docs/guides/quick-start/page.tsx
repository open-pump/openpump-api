'use client';

import { Check, Terminal, Zap } from 'lucide-react';
import Link from 'next/link';
import { DocsLayout } from '@/components/docs-layout';

export default function QuickStartPage() {
  return (
    <DocsLayout>
      <div className="prose prose-gray max-w-none">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-8 h-8 text-primary-500" />
            <h1 className="text-4xl font-bold text-gray-900">Quick Start Guide</h1>
          </div>
          <p className="text-xl text-gray-600">
            Get up and running with the OpenPump API in under 5 minutes
          </p>
        </div>

        {/* 5-Minute Checklist */}
        <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">5-Minute Checklist</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-gray-700">Make your first API request</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-gray-700">Fetch comprehensive token data</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-gray-700">Understand quality scores</span>
            </div>
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-gray-700">Handle errors gracefully</span>
            </div>
          </div>
        </div>

        {/* Step 1 */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Make Your First Request</h2>
          </div>

          <p className="text-gray-600 mb-6">
            The OpenPump API requires no authentication to get started. Simply make a GET request to any endpoint:
          </p>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Terminal className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">cURL</span>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`curl https://api.openpump.io/v1/tokens/HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC`}
              </pre>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Tip:</strong> Replace the mint address with any Pump.fun token address to get its data.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Understand the Response</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Every successful response includes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Metadata</h3>
              <p className="text-sm text-gray-600 mb-3">
                Token name, symbol, description, image, and creator address
              </p>
              <div className="bg-gray-900 rounded-lg p-3">
                <pre className="text-green-400 font-mono text-xs">
{`{
  "name": "Example Token",
  "symbol": "EXAM",
  "description": "...",
  "image": "https://..."
}`}
                </pre>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Pricing</h3>
              <p className="text-sm text-gray-600 mb-3">
                Real-time price, market cap, volume, and 24h change
              </p>
              <div className="bg-gray-900 rounded-lg p-3">
                <pre className="text-green-400 font-mono text-xs">
{`{
  "price_usd": 0.00012,
  "market_cap": 123450,
  "volume_24h": 45678,
  "change_24h": 12.5
}`}
                </pre>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Quality Score</h3>
              <p className="text-sm text-gray-600 mb-3">
                Automatic 0-100 score based on metadata, socials, and liquidity
              </p>
              <div className="bg-gray-900 rounded-lg p-3">
                <pre className="text-green-400 font-mono text-xs">
{`{
  "quality_score": 87
}`}
                </pre>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="font-bold text-gray-900 mb-3">Bonding Curve</h3>
              <p className="text-sm text-gray-600 mb-3">
                Progress percentage, SOL reserves, migration status
              </p>
              <div className="bg-gray-900 rounded-lg p-3">
                <pre className="text-green-400 font-mono text-xs">
{`{
  "progress": 67.5,
  "sol_reserves": 42.5,
  "migrated": false
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Integrate in Your Code</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Here's how to integrate the API in popular languages:
          </p>

          {/* JavaScript/TypeScript */}
          <div className="mb-6">
            <div className="bg-gray-800 px-6 py-3 rounded-t-xl">
              <span className="text-white font-semibold">JavaScript / TypeScript</span>
            </div>
            <div className="bg-gray-900 rounded-b-xl p-6">
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`async function getTokenData(mint: string) {
  const response = await fetch(
    \`https://api.openpump.io/v1/tokens/\${mint}\`
  );

  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }

  const data = await response.json();
  return data.data;
}

// Usage
const token = await getTokenData(
  'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC'
);

console.log(\`Token: \${token.metadata.name}\`);
console.log(\`Price: $\${token.pricing.price_usd}\`);
console.log(\`Quality: \${token.quality_score}/100\`);`}
              </pre>
            </div>
          </div>

          {/* Python */}
          <div className="mb-6">
            <div className="bg-gray-800 px-6 py-3 rounded-t-xl">
              <span className="text-white font-semibold">Python</span>
            </div>
            <div className="bg-gray-900 rounded-b-xl p-6">
              <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`import requests

def get_token_data(mint: str):
    response = requests.get(
        f"https://api.openpump.io/v1/tokens/{mint}"
    )

    if response.status_code != 200:
        raise Exception(f"Error: {response.status_code}")

    return response.json()["data"]

# Usage
token = get_token_data(
    "HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC"
)

print(f"Token: {token['metadata']['name']}")
print(f"Price: ${token['pricing']['price_usd']}")
print(f"Quality: {token['quality_score']}/100")`}
              </pre>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Filter by Quality Score</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Use quality scores to filter out low-quality tokens automatically:
          </p>

          <div className="bg-gray-900 rounded-xl p-6 mb-6">
            <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`async function getHighQualityTokens(mints: string[]) {
  const tokens = await Promise.all(
    mints.map(mint => getTokenData(mint))
  );

  // Filter for quality score > 70
  const highQuality = tokens.filter(
    token => token.quality_score > 70
  );

  return highQuality.sort(
    (a, b) => b.quality_score - a.quality_score
  );
}`}
            </pre>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">Quality Score Guidelines</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">90-100: Exceptional</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 font-semibold rounded">Graduated</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">70-89: High Quality</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 font-semibold rounded">Final Stretch</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">50-69: Medium</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 font-semibold rounded">Rising</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">0-49: Low Quality</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-700 font-semibold rounded">New/Trash</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5 */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Handle Errors</h2>
          </div>

          <p className="text-gray-600 mb-6">
            Always handle errors gracefully in production:
          </p>

          <div className="bg-gray-900 rounded-xl p-6">
            <pre className="text-green-400 font-mono text-sm overflow-x-auto">
{`async function safeGetTokenData(mint: string) {
  try {
    const response = await fetch(
      \`https://api.openpump.io/v1/tokens/\${mint}\`
    );

    if (!response.ok) {
      const error = await response.json();

      // Handle specific errors
      if (error.error?.code === 'TOKEN_NOT_FOUND') {
        console.log('Token not found on Pump.fun');
        return null;
      }

      if (error.error?.code === 'INVALID_MINT') {
        console.log('Invalid mint address format');
        return null;
      }

      throw new Error(error.error?.message);
    }

    return await response.json();

  } catch (err) {
    console.error('API Error:', err);
    return null;
  }
}`}
            </pre>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
          <p className="mb-6 text-primary-100">
            Now that you're up and running, explore more features:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/api"
              className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg p-4 transition-all"
            >
              <h3 className="font-bold mb-2">Full API Reference</h3>
              <p className="text-sm text-primary-100">Explore all endpoints and parameters</p>
            </Link>
            <Link
              href="/docs/guides/building-a-bot"
              className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg p-4 transition-all"
            >
              <h3 className="font-bold mb-2">Build a Trading Bot</h3>
              <p className="text-sm text-primary-100">Learn to automate your trading</p>
            </Link>
            <Link
              href="/docs/examples"
              className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg p-4 transition-all"
            >
              <h3 className="font-bold mb-2">Code Examples</h3>
              <p className="text-sm text-primary-100">Real-world integration examples</p>
            </Link>
            <Link
              href="/docs/guides/rate-limits"
              className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-lg p-4 transition-all"
            >
              <h3 className="font-bold mb-2">Rate Limits</h3>
              <p className="text-sm text-primary-100">Optimize your API usage</p>
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
