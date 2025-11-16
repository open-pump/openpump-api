'use client';

import { useEffect, useState, useRef } from 'react';
import { Zap, TrendingUp, Clock, Copy, Check } from 'lucide-react';

interface NewTokenEvent {
  type: 'new_token' | 'token_enriched';
  timestamp: number;
  mint: string;
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
}

interface ConnectionStatus {
  connected: boolean;
  processedCount: number;
  subscriptionId: number | null;
}

export function RealtimeTokenFeed() {
  const [tokens, setTokens] = useState<NewTokenEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    processedCount: 0,
    subscriptionId: null,
  });
  const [copiedMint, setCopiedMint] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
            setTokens((prev) => [data, ...prev].slice(0, 20));
          } else if (data.type === 'token_enriched') {
            // Update existing token with enriched data
            setTokens((prev) =>
              prev.map((token) => (token.mint === data.mint ? { ...token, ...data } : token))
            );
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
        // Reconnect after 3 seconds
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
  }, []);

  const copyToClipboard = (mint: string) => {
    navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 2000);
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Zap className="w-6 h-6 text-yellow-500" />
            {status.connected && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Live Token Launches</h3>
            <p className="text-xs text-gray-500">
              {status.connected ? (
                <>
                  <span className="text-green-600 font-medium">Connected</span> - {status.processedCount.toLocaleString()}{' '}
                  transactions processed
                </>
              ) : (
                <span className="text-red-600 font-medium">Connecting...</span>
              )}
            </p>
          </div>
        </div>
        {tokens.length > 0 && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            {tokens.length} new
          </span>
        )}
      </div>

      {tokens.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Waiting for new token launches...</p>
          <p className="text-xs text-gray-400 mt-2">Tokens launch every few seconds on Pump.fun</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {tokens.map((token, index) => (
            <div
              key={`${token.mint}-${token.timestamp}`}
              className={`border border-gray-200 rounded-xl p-4 transition-all ${
                index === 0 ? 'bg-yellow-50 border-yellow-200 animate-pulse-once' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <img
                      src={token.image || `https://pump.fun/coin/${token.mint}`}
                      alt={token.symbol || 'Token'}
                      className="w-8 h-8 rounded-full bg-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // Generate a colored placeholder with first letter
                        const letter = token.symbol?.[0] || token.name?.[0] || '?';
                        target.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect fill="#667eea" width="32" height="32" rx="16"/><text x="16" y="21" text-anchor="middle" fill="white" font-size="14" font-family="sans-serif">${letter}</text></svg>`)}`;
                      }}
                    />
                    <div>
                      <h4 className="font-bold text-gray-900 truncate">
                        {token.name || token.symbol || 'Loading...'}
                      </h4>
                      {token.symbol && (
                        <span className="text-xs text-gray-500">${token.symbol}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatTime(token.timestamp)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 truncate flex-1">
                  {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                </code>
                <button
                  onClick={() => copyToClipboard(token.mint)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Copy mint address"
                >
                  {copiedMint === token.mint ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>

              {token.bondingCurve && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Progress</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, token.bondingCurve.progress)}%` }}
                        ></div>
                      </div>
                      <span className="font-medium text-gray-900">
                        {token.bondingCurve.progress.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">SOL Raised</span>
                    <div className="font-medium text-gray-900">
                      {token.bondingCurve.solRaised.toFixed(2)} SOL
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Market Cap</span>
                    <div className="font-medium text-gray-900">
                      {token.bondingCurve.marketCap.toFixed(2)} SOL
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Price</span>
                    <div className="font-medium text-gray-900 text-xs">
                      {token.bondingCurve.currentPrice.toFixed(12)}
                    </div>
                  </div>
                </div>
              )}

              {token.description && (
                <p className="text-xs text-gray-600 mt-3 line-clamp-2">{token.description}</p>
              )}

              <div className="mt-3 flex space-x-2">
                <a
                  href={`https://pump.fun/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-3 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  View on Pump.fun
                </a>
                <a
                  href={`https://solscan.io/token/${token.mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Solscan
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
