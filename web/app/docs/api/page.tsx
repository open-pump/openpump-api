'use client';

import { Code, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { DocsLayout } from '@/components/docs-layout';

export default function APIReferencePage() {
  return (
    <DocsLayout>
      <div className="prose prose-gray max-w-none">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">API Reference</h1>
          <p className="text-xl text-gray-600">
            Complete reference for all OpenPump API endpoints, parameters, and responses
          </p>
        </div>

        {/* Base URL */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Base URL</h2>
          <code className="block bg-white px-4 py-3 rounded-lg font-mono text-sm text-gray-900 border border-gray-200">
            https://api.openpump.io
          </code>
          <p className="mt-3 text-sm text-gray-600">
            All API requests should be made to this base URL with the appropriate endpoint path.
          </p>
        </div>

        {/* Authentication */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
          <p className="text-gray-600 mb-4">
            Currently, the OpenPump API does not require authentication. All endpoints are publicly accessible.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> API key authentication will be required in the future for higher rate limits and premium features.
            </p>
          </div>
        </div>

        {/* Endpoints */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Endpoints</h2>
          <div className="space-y-4">
            {/* Token Endpoint */}
            <Link
              href="/docs/api/tokens"
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    GET
                  </span>
                  <code className="text-base font-mono font-semibold text-gray-900">/v1/tokens/:mint</code>
                </div>
                <Shield className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-gray-600 mb-3">
                Get comprehensive token information including metadata, pricing, quality scores, bonding curve data, and social links
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  Quality Score
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Real-time Pricing
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Social Links
                </span>
              </div>
            </Link>

            {/* Metadata Endpoint */}
            <Link
              href="/docs/api/metadata"
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    GET
                  </span>
                  <code className="text-base font-mono font-semibold text-gray-900">/v1/metadata/:mint</code>
                </div>
                <Code className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-gray-600 mb-3">
                Fetch token metadata including name, symbol, description, image, and IPFS content
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  IPFS Support
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  Image URLs
                </span>
              </div>
            </Link>

            {/* Pricing Endpoint */}
            <Link
              href="/docs/api/pricing"
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    GET
                  </span>
                  <code className="text-base font-mono font-semibold text-gray-900">/v1/pricing/:mint</code>
                </div>
                <TrendingUp className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-gray-600 mb-3">
                Get real-time blockchain-direct pricing with market cap, 24h volume, and price change statistics
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Real-time
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Blockchain-direct
                </span>
              </div>
            </Link>

            {/* Bonding Curve Endpoint */}
            <Link
              href="/docs/api/bonding"
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    GET
                  </span>
                  <code className="text-base font-mono font-semibold text-gray-900">/v1/bonding/:mint</code>
                </div>
                <Shield className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-gray-600 mb-3">
                Access detailed bonding curve data including completion percentage, SOL reserves, migration status
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  Curve Progress
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  Migration Status
                </span>
              </div>
            </Link>

            {/* Simulation Endpoint */}
            <Link
              href="/docs/api/simulation"
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                    POST
                  </span>
                  <code className="text-base font-mono font-semibold text-gray-900">/v1/simulate</code>
                </div>
                <Code className="w-5 h-5 text-primary-500" />
              </div>
              <p className="text-gray-600 mb-3">
                Simulate trades before execution to estimate price impact, slippage, and expected output
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                  Price Impact
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Slippage
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Response Format */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Response Format</h2>
          <p className="text-gray-600 mb-4">
            All API responses follow a consistent JSON format:
          </p>
          <div className="bg-gray-900 rounded-xl p-6 text-white font-mono text-sm overflow-x-auto">
            <pre className="text-green-400">{`{
  "success": true,
  "data": {
    // Endpoint-specific data
  },
  "meta": {
    "timestamp": "2025-01-14T12:00:00Z",
    "version": "1.0.0"
  }
}`}</pre>
          </div>
        </div>

        {/* Error Handling */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Handling</h2>
          <p className="text-gray-600 mb-4">
            Errors are returned with appropriate HTTP status codes and detailed messages:
          </p>
          <div className="bg-gray-900 rounded-xl p-6 text-white font-mono text-sm overflow-x-auto">
            <pre className="text-red-400">{`{
  "success": false,
  "error": {
    "code": "TOKEN_NOT_FOUND",
    "message": "Token with mint HeLp6...98jwC not found",
    "status": 404
  }
}`}</pre>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Rate Limits</h2>
          <p className="text-gray-700 mb-4">
            Current rate limits are generous for public use:
          </p>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span><strong>100 requests per minute</strong> per IP address</span>
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              <span><strong>5,000 requests per hour</strong> per IP address</span>
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            For higher limits, contact us about API key access.
          </p>
        </div>
      </div>
    </DocsLayout>
  );
}
