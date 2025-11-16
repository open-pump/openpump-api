'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Search, TrendingUp, Shield, Zap, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RealtimeTokenDashboard } from '@/components/realtime-token-dashboard';

interface Token {
  mint: string;
  name: string;
  symbol: string;
  creator: string;
  quality_score: number;
  category: string;
  change_24h: number | null;
  price_usd: number;
  market_cap: number;
  progress: number;
}

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  let authenticated = false;
  let user = null;
  let ready = true;
  let login = () => console.log('Privy not configured');
  let logout = () => console.log('Privy not configured');

  try {
    const privyHook = usePrivy();
    authenticated = privyHook.authenticated;
    user = privyHook.user;
    ready = privyHook.ready;
    login = privyHook.login;
    logout = privyHook.logout;
  } catch (e) {
    // Privy not configured, use defaults
  }

  useEffect(() => {
    async function fetchTokens() {
      try {
        // Fetch directly from Pump.fun client-side to avoid Cloudflare blocks
        const response = await fetch('https://frontend-api.pump.fun/coins?offset=0&limit=50&sort=last_trade_timestamp&order=DESC&includeNsfw=false');

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const data = await response.json();

        // Transform top 3 tokens
        const transformedTokens = data.slice(0, 3).map((coin: any) => {
          const marketCap = coin.usd_market_cap || 0;
          const qualityScore = Math.min(100, Math.floor(
            (marketCap / 10000) * 20 +
            (coin.reply_count || 0) / 2 +
            30
          ));

          let category = 'New';
          if (marketCap > 500000) category = 'Graduated';
          else if (marketCap > 100000) category = 'Final Stretch';
          else if (marketCap > 50000) category = 'Rising';

          return {
            mint: coin.mint,
            name: coin.name,
            symbol: coin.symbol,
            creator: coin.creator?.substring(0, 8) + '...' || 'Unknown',
            quality_score: qualityScore,
            category,
            change_24h: null,
            price_usd: parseFloat(coin.price || 0),
            market_cap: marketCap,
            progress: Math.min(100, (marketCap / 500000) * 100),
          };
        });

        setTokens(transformedTokens);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
        setLoading(false);
      }
    }
    fetchTokens();
  }, []);

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
                <Link href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <Link href="/docs/guides/quick-start" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Examples
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {ready && !authenticated && (
                <button
                  onClick={login}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                >
                  Get API Key
                </button>
              )}
              {authenticated && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">
                    {user?.email?.address || user?.wallet?.address.slice(0, 6) + '...'}
                  </span>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-50 rounded-full">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-primary-700">Open Source • No Auth Required • Always Free</span>
          </div>

          <h1 className="text-6xl font-bold text-gray-900 tracking-tight">
            The Complete
            <br />
            <span className="text-primary-500">Pump.fun API</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time pricing, quality scores, and social data for every token on Pump.fun. Simple, fast, and always free.
          </p>

          <div className="flex items-center justify-center space-x-4 pt-4">
            <Link
              href="/docs/guides/quick-start"
              className="px-8 py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold text-lg"
            >
              Get Started
            </Link>
            <Link
              href="/docs/api"
              className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-primary-500 hover:text-primary-600 transition-colors font-semibold text-lg"
            >
              View Docs
            </Link>
          </div>
        </div>

        {/* Live Tokens */}
        <div className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Live on Pump.fun</h2>
              <p className="text-sm text-gray-500 mt-1">Real-time data from the API</p>
            </div>
            <Link href="/docs/api/tokens" className="text-primary-500 hover:text-primary-600 font-medium flex items-center space-x-1">
              <span>View API Docs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              // Actual token cards
              tokens.map((token) => (
                <div key={token.mint} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-primary-300 transition-all hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{token.symbol}</h3>
                      <p className="text-sm text-gray-500">by {token.creator}</p>
                    </div>
                    <TrendingUp className={`w-6 h-6 ${token.change_24h && token.change_24h > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quality Score</span>
                      <span className="text-lg font-bold text-gray-900">{token.quality_score}/100</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Category</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        token.category === 'Graduated' ? 'bg-purple-100 text-purple-700' :
                        token.category === 'Final Stretch' ? 'bg-orange-100 text-orange-700' :
                        token.category === 'Rising' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {token.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {token.change_24h !== null ? '24h Change' : 'Progress'}
                      </span>
                      <span className={`text-sm font-semibold ${
                        token.change_24h !== null && token.change_24h > 0 ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {token.change_24h !== null ? `+${token.change_24h}%` : `${token.progress}%`}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-Time Token Feed */}
        <div className="mt-20 bg-gray-950 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Real-Time Token Launches</h2>
              <p className="text-sm text-gray-400 mt-1">Live WebSocket stream with sorting, filtering, and pause controls</p>
            </div>
            <Link href="/docs/api/websocket" className="text-yellow-400 hover:text-yellow-300 font-medium flex items-center space-x-1">
              <span>WebSocket API Docs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <RealtimeTokenDashboard />
        </div>

        {/* Features Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose OpenPump?
            </h2>
            <p className="text-xl text-gray-600">
              The most comprehensive Pump.fun intelligence API
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Quality Scoring</h3>
              <p className="text-gray-600">
                Automatic 0-100 quality scores filter out trash tokens before you waste time
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
                <Zap className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Real-Time Data</h3>
              <p className="text-gray-600">
                Blockchain-direct pricing and bonding curve data updated in real-time
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
                <BarChart3 className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Social Intelligence</h3>
              <p className="text-gray-600">
                Auto-extracted social links and verification for every token
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 border-t border-gray-200 pt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-primary-500 mb-2">10M+</div>
              <div className="text-gray-600">API Requests</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary-500 mb-2">50K+</div>
              <div className="text-gray-600">Tokens Analyzed</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary-500 mb-2">1,000+</div>
              <div className="text-gray-600">Active Developers</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-primary-500 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-16 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of developers building with OpenPump
          </p>
          {!authenticated ? (
            <button
              onClick={login}
              className="px-8 py-4 bg-white text-primary-600 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              Sign Up for Free
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="inline-block px-8 py-4 bg-white text-primary-600 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/tokens" className="text-gray-600 hover:text-gray-900">Tokens</Link></li>
                <li><Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link></li>
                <li><Link href="/rankings" className="text-gray-600 hover:text-gray-900">Rankings</Link></li>
                <li><Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Developers</h3>
              <ul className="space-y-2">
                <li><Link href="http://localhost:49729" target="_blank" className="text-gray-600 hover:text-gray-900">Documentation</Link></li>
                <li><Link href="/api" className="text-gray-600 hover:text-gray-900">API Reference</Link></li>
                <li><Link href="/guides" className="text-gray-600 hover:text-gray-900">Guides</Link></li>
                <li><Link href="/examples" className="text-gray-600 hover:text-gray-900">Examples</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link></li>
                <li><Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link></li>
                <li><Link href="/careers" className="text-gray-600 hover:text-gray-900">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link></li>
                <li><Link href="/security" className="text-gray-600 hover:text-gray-900">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
            <p>&copy; 2025 OpenPump. Open source and MIT licensed.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
