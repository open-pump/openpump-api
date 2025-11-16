'use client';

import { useEffect, useState, useRef } from 'react';
import { Zap, Copy, Check, ExternalLink, Filter, ArrowUpDown, Pause, Play, Settings2, Users, TrendingUp, Clock, Coins } from 'lucide-react';

interface TokenData {
  mint: string;
  timestamp: number;
  signature?: string;
  creator?: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  bondingCurve?: {
    progress: number;
    solRaised: number;
    currentPrice: number;
    marketCap: number;
  };
  // Simulated metrics (would come from real data in production)
  age?: string;
  txCount?: number;
  holders?: number;
  volume24h?: number;
  priceChange?: number;
}

interface ConnectionStatus {
  connected: boolean;
  processedCount: number;
  subscriptionId: number | null;
}

type SortField = 'time' | 'mcap' | 'volume' | 'progress';
type FilterMode = 'all' | 'high_progress' | 'high_volume';

export function RealtimeTokenDashboard() {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    processedCount: 0,
    subscriptionId: null,
  });
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [sortField, setSortField] = useState<SortField>('time');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [maxTokens, setMaxTokens] = useState(50);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pausedTokensRef = useRef<TokenData[]>([]);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://localhost:4000/v1/stream');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to OpenPump real-time stream');
        setStatus((prev) => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connected') {
            setStatus({
              connected: true,
              processedCount: data.status.processedCount,
              subscriptionId: data.status.subscriptionId,
            });
          } else if (data.type === 'new_token') {
            const newToken: TokenData = {
              ...data,
              age: '0s',
              txCount: Math.floor(Math.random() * 20),
              holders: Math.floor(Math.random() * 10),
              volume24h: 0,
              priceChange: 0,
            };

            if (isPaused) {
              pausedTokensRef.current = [newToken, ...pausedTokensRef.current].slice(0, maxTokens);
            } else {
              setTokens((prev) => [newToken, ...prev].slice(0, maxTokens));
            }
          } else if (data.type === 'token_enriched') {
            const updateFn = (prev: TokenData[]) =>
              prev.map((token) =>
                token.mint === data.mint
                  ? {
                      ...token,
                      ...data,
                      txCount: token.txCount || Math.floor(Math.random() * 20),
                      holders: token.holders || Math.floor(Math.random() * 10),
                    }
                  : token
              );

            if (isPaused) {
              pausedTokensRef.current = updateFn(pausedTokensRef.current);
            } else {
              setTokens(updateFn);
            }
          } else if (data.type === 'status') {
            setStatus({
              connected: true,
              processedCount: data.data.processedCount,
              subscriptionId: data.data.subscriptionId,
            });
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setStatus((prev) => ({ ...prev, connected: false }));
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isPaused, maxTokens]);

  // Update ages every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens((prev) =>
        prev.map((token) => ({
          ...token,
          age: formatAge(token.timestamp),
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const togglePause = () => {
    if (isPaused) {
      // Resume - merge paused tokens
      setTokens((prev) => [...pausedTokensRef.current, ...prev].slice(0, maxTokens));
      pausedTokensRef.current = [];
    }
    setIsPaused(!isPaused);
  };

  const copyToClipboard = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const formatAge = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const formatNumber = (num: number, decimals = 2) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredTokens = tokens.filter((token) => {
    if (filterMode === 'high_progress') {
      return (token.bondingCurve?.progress || 0) >= 10;
    }
    if (filterMode === 'high_volume') {
      return (token.bondingCurve?.solRaised || 0) >= 0.5;
    }
    return true;
  });

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    switch (sortField) {
      case 'mcap':
        return (b.bondingCurve?.marketCap || 0) - (a.bondingCurve?.marketCap || 0);
      case 'volume':
        return (b.bondingCurve?.solRaised || 0) - (a.bondingCurve?.solRaised || 0);
      case 'progress':
        return (b.bondingCurve?.progress || 0) - (a.bondingCurve?.progress || 0);
      default:
        return b.timestamp - a.timestamp;
    }
  });

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Zap className="w-5 h-5 text-yellow-400" />
              {status.connected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">New Pairs</h3>
              <p className="text-xs text-gray-400">
                {status.connected ? (
                  <span className="text-green-400">Live</span>
                ) : (
                  <span className="text-red-400">Connecting...</span>
                )}
                {' · '}{tokens.length} tokens
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filter dropdown */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              className="bg-gray-700 text-gray-300 text-xs rounded px-2 py-1 border border-gray-600"
            >
              <option value="all">All Tokens</option>
              <option value="high_progress">Progress &gt; 10%</option>
              <option value="high_volume">Volume &gt; 0.5 SOL</option>
            </select>

            {/* Sort dropdown */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-gray-700 text-gray-300 text-xs rounded px-2 py-1 border border-gray-600"
            >
              <option value="time">Latest</option>
              <option value="mcap">Market Cap</option>
              <option value="volume">Volume</option>
              <option value="progress">Progress</option>
            </select>

            {/* Pause/Play */}
            <button
              onClick={togglePause}
              className={`p-1.5 rounded ${
                isPaused ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'
              } hover:bg-gray-600`}
              title={isPaused ? 'Resume feed' : 'Pause feed'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="max-h-[600px] overflow-y-auto">
        {sortedTokens.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Waiting for new tokens...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {sortedTokens.map((token, index) => (
              <div
                key={`${token.mint}-${token.timestamp}`}
                className={`p-3 hover:bg-gray-800/50 transition-colors ${
                  index === 0 && !isPaused ? 'bg-green-500/5 animate-pulse-once' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Token Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={token.image || `https://pump.fun/coin/${token.mint}`}
                      alt={token.symbol || 'Token'}
                      className="w-10 h-10 rounded-lg bg-gray-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const letter = token.symbol?.[0] || token.name?.[0] || '?';
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="#374151" width="40" height="40" rx="8"/><text x="20" y="26" text-anchor="middle" fill="#9CA3AF" font-size="16" font-family="sans-serif">${letter}</text></svg>`)}`;
                      }}
                    />
                    {(token.bondingCurve?.progress || 0) >= 90 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                    )}
                  </div>

                  {/* Token Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm truncate max-w-[120px]">
                          {token.symbol || '???'}
                        </span>
                        <span className="text-gray-400 text-xs truncate max-w-[100px]">
                          {token.name || 'Loading...'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {token.age}
                      </span>
                    </div>

                    {/* Metrics Row */}
                    <div className="flex items-center space-x-4 text-xs">
                      <div className="flex items-center text-gray-400" title="Market Cap in USD">
                        <span className="text-gray-500 mr-1">MC</span>
                        <span className="text-white font-medium">
                          ${formatNumber((token.bondingCurve?.marketCap || 0) * 150)}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-400" title="Total SOL raised in bonding curve">
                        <span className="text-gray-500 mr-1">V</span>
                        <span className="text-green-400 font-medium">
                          {token.bondingCurve?.solRaised?.toFixed(2) || '0'} SOL
                        </span>
                      </div>
                      <div className="flex items-center text-gray-400" title="Number of holders">
                        <Users className="w-3 h-3 mr-1 text-purple-400" />
                        <span>{token.holders || 0}</span>
                      </div>
                      <div className="flex items-center text-gray-400" title="Transaction count">
                        <span className="text-gray-500 mr-1">TX</span>
                        <span>{token.txCount || 0}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {token.bondingCurve && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Bonding Progress</span>
                          <span className="text-gray-400 font-medium">
                            {token.bondingCurve.progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getProgressColor(
                              token.bondingCurve.progress
                            )}`}
                            style={{ width: `${Math.min(100, token.bondingCurve.progress)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => copyToClipboard(token.mint)}
                      className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                      title="Copy address"
                    >
                      {copiedMint === token.mint ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                    <a
                      href={`https://pump.fun/${token.mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                      title="View on Pump.fun"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-800/50 px-4 py-2 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {isPaused && pausedTokensRef.current.length > 0 && (
              <span className="text-yellow-400">
                {pausedTokensRef.current.length} new tokens paused
              </span>
            )}
          </span>
          <span>
            {status.processedCount.toLocaleString()} txs processed
          </span>
        </div>
      </div>
    </div>
  );
}
