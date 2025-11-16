'use client';

import { Search, Book, Code, Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DocsLayout } from '@/components/docs-layout';

export default function DocsPage() {
  return (
    <DocsLayout>
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          OpenPump API Documentation
        </h1>
        <p className="text-xl text-gray-600">
          Everything you need to build with the most comprehensive Pump.fun intelligence API
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search documentation..."
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
          />
        </div>
      </div>

      {/* Quick Start Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Start Card */}
          <Link
            href="/docs/guides/quick-start"
            className="group bg-gradient-to-br from-primary-50 to-green-50 border border-primary-200 rounded-xl p-6 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Start</h3>
            <p className="text-gray-600 text-sm mb-4">
              Get up and running with the OpenPump API in under 5 minutes
            </p>
            <div className="flex items-center text-primary-600 font-medium text-sm">
              <span>Start building</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* API Reference Card */}
          <Link
            href="/docs/api"
            className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-50 transition-colors">
              <Code className="w-6 h-6 text-gray-700 group-hover:text-primary-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">API Reference</h3>
            <p className="text-gray-600 text-sm mb-4">
              Complete reference for all endpoints, parameters, and responses
            </p>
            <div className="flex items-center text-primary-600 font-medium text-sm">
              <span>Explore API</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Examples Card */}
          <Link
            href="/docs/examples"
            className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-primary-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-50 transition-colors">
              <Book className="w-6 h-6 text-gray-700 group-hover:text-primary-600 transition-colors" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Code Examples</h3>
            <p className="text-gray-600 text-sm mb-4">
              Real-world examples in TypeScript, Python, Rust, and more
            </p>
            <div className="flex items-center text-primary-600 font-medium text-sm">
              <span>View examples</span>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Topics</h2>
        <div className="space-y-4">
          <Link
            href="/docs/api/tokens"
            className="block group bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    GET
                  </span>
                  <code className="text-sm font-mono text-gray-900">/v1/tokens/:mint</code>
                </div>
                <p className="text-gray-600 text-sm">
                  Get comprehensive token information including metadata, pricing, quality scores, and social links
                </p>
              </div>
              <Shield className="w-5 h-5 text-gray-400 ml-4 group-hover:text-primary-500 transition-colors" />
            </div>
          </Link>

          <Link
            href="/docs/api/pricing"
            className="block group bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                    GET
                  </span>
                  <code className="text-sm font-mono text-gray-900">/v1/pricing/:mint</code>
                </div>
                <p className="text-gray-600 text-sm">
                  Get real-time blockchain-direct pricing with market cap and 24h statistics
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400 ml-4 group-hover:text-primary-500 transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      {/* Key Features */}
      <div className="border-t border-gray-200 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Why OpenPump?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Quality Scoring</h3>
            <p className="text-gray-600 text-sm">
              Automatic 0-100 quality scores filter out trash tokens before you waste time
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
              <Zap className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Real-Time Data</h3>
            <p className="text-gray-600 text-sm">
              Blockchain-direct pricing and bonding curve data updated in real-time
            </p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-4">
              <Code className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Developer Friendly</h3>
            <p className="text-gray-600 text-sm">
              Simple REST API with comprehensive docs and code examples
            </p>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
