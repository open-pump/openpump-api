import { config } from '../config';

interface HeliusAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
    };
    json_uri?: string;
    files?: Array<{
      uri?: string;
      cdn_uri?: string;
    }>;
  };
  creators?: Array<{
    address: string;
    verified: boolean;
  }>;
  supply?: {
    print_current_supply?: number;
    print_max_supply?: number;
  };
}

interface HeliusAssetResponse {
  jsonrpc: string;
  result: HeliusAsset;
  id: string;
}

export class HeliusClient {
  private rpcUrl: string;

  constructor() {
    this.rpcUrl = config.solana.rpcUrl;
  }

  async getAsset(mint: string): Promise<HeliusAsset | null> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'openpump-api',
          method: 'getAsset',
          params: {
            id: mint,
            displayOptions: {
              showFungible: true,
            },
          },
        }),
      });

      if (!response.ok) {
        console.error(`Helius API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data: HeliusAssetResponse = await response.json();

      if (!data.result) {
        return null;
      }

      return data.result;
    } catch (error) {
      console.error(`Error fetching asset from Helius:`, error);
      return null;
    }
  }

  async getTokenMetadata(mint: string): Promise<{
    name?: string;
    symbol?: string;
    description?: string;
    uri?: string;
    image?: string;
    creator?: string;
  } | null> {
    const asset = await this.getAsset(mint);

    if (!asset) {
      return null;
    }

    return {
      name: asset.content?.metadata?.name,
      symbol: asset.content?.metadata?.symbol,
      description: asset.content?.metadata?.description,
      uri: asset.content?.json_uri,
      image: asset.content?.files?.[0]?.cdn_uri || asset.content?.files?.[0]?.uri,
      creator: asset.creators?.[0]?.address,
    };
  }
}

export const heliusClient = new HeliusClient();
