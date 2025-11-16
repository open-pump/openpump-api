'use client';

import { Check, X, Zap, Rocket, TrendingUp, Building } from 'lucide-react';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

export default function PricingPage() {
  let authenticated = false;
  let login = () => console.log('Privy not configured');

  try {
    const privyHook = usePrivy();
    authenticated = privyHook.authenticated;
    login = privyHook.login;
  } catch (e) {
    // Privy not configured, use defaults
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-900">OpenPump</span>
              </Link>
              <div className="hidden md:flex space-x-6">
                <Link href="/docs/api" className="text-gray-700 hover:text-gray-900 transition-colors font-medium">
                  API
                </Link>
                <Link href="/docs" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Docs
                </Link>
                <Link href="/pricing" className="text-primary-500 font-medium transition-colors">
                  Pricing
                </Link>
                <Link href="/docs/guides/quick-start" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Examples
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {!authenticated && (
                <button
                  onClick={login}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Get API Key
                </button>
              )}
              {authenticated && (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-50 rounded-full">
              <span className="text-sm font-medium text-primary-700">Open Source Core • Paid Intelligence Features</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900">
              Start Free, Scale as You Grow
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Basic Pump.fun data is free and open source. Upgrade for competitive intelligence, quality scores, and advanced analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Free/Open Source Tier */}
          <div className="bg-white border-2 border-primary-200 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-6 h-6 text-primary-500" />
              <h3 className="text-xl font-bold text-gray-900">Open Source</h3>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $0<span className="text-lg text-gray-500 font-normal">/forever</span>
              </div>
              <p className="text-sm text-gray-600">Self-host or use our API</p>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Basic Pump.fun token data</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Real-time pricing</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Bonding curve data</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">100 req/min</span>
              </li>
              <li className="flex items-start">
                <X className="w-4 h-4 text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">Quality scores</span>
              </li>
              <li className="flex items-start">
                <X className="w-4 h-4 text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">Social intelligence</span>
              </li>
              <li className="flex items-start">
                <X className="w-4 h-4 text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">Competitive analytics</span>
              </li>
            </ul>

            <Link
              href="/docs/guides/quick-start"
              className="block w-full px-4 py-2.5 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-center text-sm"
            >
              Get Started Free
            </Link>
          </div>

          {/* $49/mo Tier */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Rocket className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Starter</h3>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $49<span className="text-lg text-gray-500 font-normal">/mo</span>
              </div>
              <p className="text-sm text-gray-600">For individual developers</p>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Everything in Free</strong></span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">AI quality scores (0-100)</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Social link extraction</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">500 req/min</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">25K req/hour</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Email support</span>
              </li>
              <li className="flex items-start">
                <X className="w-4 h-4 text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">Competitive analytics</span>
              </li>
            </ul>

            <button
              onClick={!authenticated ? login : undefined}
              className="w-full px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm"
            >
              Upgrade to Starter
            </button>
          </div>

          {/* $149/mo Tier */}
          <div className="bg-white border-2 border-primary-500 rounded-2xl p-6 relative shadow-lg transform scale-105">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
              Most Popular
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-6 h-6 text-primary-500" />
              <h3 className="text-xl font-bold text-gray-900">Pro</h3>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $149<span className="text-lg text-gray-500 font-normal">/mo</span>
              </div>
              <p className="text-sm text-gray-600">For serious traders & bots</p>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Everything in Starter</strong></span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Competitive analytics</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Wallet tracking</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">1,000 req/min</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">50K req/hour</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">99.9% SLA</span>
              </li>
            </ul>

            <button
              onClick={!authenticated ? login : undefined}
              className="w-full px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* $249/mo Tier */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Growth</h3>
            </div>
            <div className="mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                $249<span className="text-lg text-gray-500 font-normal">/mo</span>
              </div>
              <p className="text-sm text-gray-600">For trading teams</p>
            </div>

            <ul className="space-y-3 mb-8 text-sm">
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700"><strong>Everything in Pro</strong></span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">WebSocket streaming</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Historical data access</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">2,500 req/min</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">125K req/hour</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Dedicated support</span>
              </li>
              <li className="flex items-start">
                <Check className="w-4 h-4 text-primary-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">99.95% SLA</span>
              </li>
            </ul>

            <button
              onClick={!authenticated ? login : undefined}
              className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold text-sm"
            >
              Upgrade to Growth
            </button>
          </div>
        </div>

        {/* Enterprise */}
        <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-3">Enterprise</h3>
              <p className="text-gray-300 mb-6">
                Custom solutions for institutional traders, market makers, and high-frequency applications
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary-400 mr-2" />
                  <span>Unlimited API requests</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary-400 mr-2" />
                  <span>Custom endpoints & integrations</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary-400 mr-2" />
                  <span>Dedicated infrastructure</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary-400 mr-2" />
                  <span>24/7 phone & Slack support</span>
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary-400 mr-2" />
                  <span>Custom SLA up to 99.99%</span>
                </li>
              </ul>
            </div>
            <div className="text-center md:text-right">
              <div className="text-4xl font-bold mb-4">Custom Pricing</div>
              <Link
                href="/contact"
                className="inline-block px-8 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>

        {/* Comparison: OpenPump vs Others */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why OpenPump?
            </h2>
            <p className="text-xl text-gray-600">
              The only open-source Pump.fun API with competitive intelligence
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-primary-600">OpenPump</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Helius</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Moralis</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Building Yourself</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Starting Price</td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-primary-600 text-xl">FREE</span>
                    <span className="block text-xs text-gray-600 mt-1">Open source</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">$99/mo</span>
                    <span className="block text-xs text-gray-600 mt-1">Developer tier</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">$49/mo</span>
                    <span className="block text-xs text-gray-600 mt-1">Pro tier</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">$500+/mo</span>
                    <span className="block text-xs text-gray-600 mt-1">Infra + dev time</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Pump.fun Support</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-primary-500 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Native support</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-gray-400 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Basic support</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-600">Build yourself</span>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Quality Scores</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-primary-500 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">AI-powered 0-100</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Competitive Intelligence</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-primary-500 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Wallet tracking, analytics</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-600">Weeks to build</span>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Social Link Extraction</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-primary-500 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Auto-extracted</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-gray-600">Build yourself</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Open Source</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-primary-500 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">MIT License</span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center text-gray-400 text-2xl">×</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-gray-400 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Your code</span>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Bonding Curve Data</td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-primary-500 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Real-time, enhanced</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-gray-400 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Generic Solana</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-gray-400 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Basic Pump data</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Check className="w-6 h-6 text-gray-400 mx-auto" />
                    <span className="block text-xs text-gray-600 mt-1">Complex</span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Setup Time</td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-primary-600">5 minutes</span>
                    <span className="block text-xs text-gray-600 mt-1">Instant start</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">1-2 hours</span>
                    <span className="block text-xs text-gray-600 mt-1">API key + integration</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">1-2 hours</span>
                    <span className="block text-xs text-gray-600 mt-1">API key + integration</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">2-4 weeks</span>
                    <span className="block text-xs text-gray-600 mt-1">Build everything</span>
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">Rate Limits (Free Tier)</td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-primary-600">100/min</span>
                    <span className="block text-xs text-gray-600 mt-1">6K/hour</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">N/A</span>
                    <span className="block text-xs text-gray-600 mt-1">Paid only</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">N/A</span>
                    <span className="block text-xs text-gray-600 mt-1">Paid only</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="block font-bold text-gray-900">∞</span>
                    <span className="block text-xs text-gray-600 mt-1">Your infra</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                What's included in the free open-source tier?
              </h3>
              <p className="text-gray-600">
                You get basic Pump.fun token data, real-time pricing, and bonding curve information. You can self-host or use our hosted API with 100 requests per minute.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                What do the paid plans add?
              </h3>
              <p className="text-gray-600">
                Paid plans unlock AI quality scores, social link extraction, competitive intelligence, wallet tracking, and much higher rate limits.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can change your plan at any time. Changes take effect immediately, and we'll prorate any differences.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Is there a money-back guarantee?
              </h3>
              <p className="text-gray-600">
                Yes! If you're not satisfied within the first 30 days of any paid plan, we'll refund your money, no questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 OpenPump. Open source and MIT licensed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
