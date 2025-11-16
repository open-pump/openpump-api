interface IPFSMetadata {
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  twitter?: string;
  telegram?: string;
  discord?: string;
  website?: string;
}

export class IPFSClient {
  private gateways = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://dweb.link/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
  ];

  private timeout = 5000; // 5 seconds per gateway

  async fetchMetadata(uri: string): Promise<IPFSMetadata | null> {
    if (!uri) return null;

    // Handle different URI formats
    let ipfsHash: string | null = null;

    if (uri.startsWith('ipfs://')) {
      ipfsHash = uri.replace('ipfs://', '');
    } else if (uri.includes('/ipfs/')) {
      const match = uri.match(/\/ipfs\/([^/?]+)/);
      ipfsHash = match ? match[1] : null;
    } else if (uri.startsWith('http')) {
      // Already a full URL, try to fetch directly
      const metadata = await this.fetchFromUrl(uri);
      if (metadata) return metadata;
    }

    if (!ipfsHash) {
      console.warn(`Could not extract IPFS hash from URI: ${uri}`);
      return null;
    }

    // Try each gateway
    for (const gateway of this.gateways) {
      const url = `${gateway}${ipfsHash}`;
      const metadata = await this.fetchFromUrl(url);
      if (metadata) {
        return metadata;
      }
    }

    return null;
  }

  private async fetchFromUrl(url: string): Promise<IPFSMetadata | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data as IPFSMetadata;
    } catch (error) {
      // Timeout or other error, try next gateway
      return null;
    }
  }

  extractSocialLinks(metadata: IPFSMetadata): {
    twitter?: string;
    telegram?: string;
    discord?: string;
    website?: string;
  } {
    const links: {
      twitter?: string;
      telegram?: string;
      discord?: string;
      website?: string;
    } = {};

    // Direct fields
    if (metadata.twitter) links.twitter = this.normalizeUrl(metadata.twitter, 'twitter');
    if (metadata.telegram) links.telegram = this.normalizeUrl(metadata.telegram, 'telegram');
    if (metadata.discord) links.discord = this.normalizeUrl(metadata.discord, 'discord');
    if (metadata.website) links.website = this.normalizeUrl(metadata.website, 'website');

    // Extract from description
    if (metadata.description) {
      const desc = metadata.description;

      // Twitter
      const twitterMatch = desc.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
      if (twitterMatch && !links.twitter) {
        links.twitter = `https://twitter.com/${twitterMatch[1]}`;
      }

      // Telegram
      const telegramMatch = desc.match(/t\.me\/([a-zA-Z0-9_]+)/);
      if (telegramMatch && !links.telegram) {
        links.telegram = `https://t.me/${telegramMatch[1]}`;
      }

      // Discord
      const discordMatch = desc.match(/discord\.gg\/([a-zA-Z0-9]+)/);
      if (discordMatch && !links.discord) {
        links.discord = `https://discord.gg/${discordMatch[1]}`;
      }

      // Website
      const websiteMatch = desc.match(/https?:\/\/(?!twitter|t\.me|discord)[^\s]+/);
      if (websiteMatch && !links.website) {
        links.website = websiteMatch[0];
      }
    }

    return links;
  }

  private normalizeUrl(url: string, platform: string): string {
    if (url.startsWith('http')) return url;

    switch (platform) {
      case 'twitter':
        return `https://twitter.com/${url.replace('@', '')}`;
      case 'telegram':
        return `https://t.me/${url.replace('@', '')}`;
      case 'discord':
        return url.startsWith('discord.gg/') ? `https://${url}` : url;
      case 'website':
        return url.startsWith('www.') ? `https://${url}` : url;
      default:
        return url;
    }
  }

  calculateQualityScore(
    onChain: { name?: string; symbol?: string; uri?: string; image?: string },
    ipfs: IPFSMetadata | null,
    socialLinks: { twitter?: string; telegram?: string; discord?: string; website?: string }
  ): number {
    let score = 0;

    // Name and symbol (20 points)
    if (onChain.name) score += 10;
    if (onChain.symbol) score += 10;

    // Description (15 points)
    if (ipfs?.description) {
      if (ipfs.description.length > 50) score += 15;
      else if (ipfs.description.length > 20) score += 10;
      else score += 5;
    }

    // Image (15 points)
    if (onChain.image || ipfs?.image) score += 15;

    // Social links (15 points total, 5 each for first 3)
    let socialCount = 0;
    if (socialLinks.twitter) { score += 5; socialCount++; }
    if (socialLinks.telegram) { score += 5; socialCount++; }
    if (socialLinks.discord || socialLinks.website) { score += 5; socialCount++; }

    // Attributes (10 points)
    if (ipfs?.attributes && ipfs.attributes.length > 0) {
      score += Math.min(10, ipfs.attributes.length * 2);
    }

    // URI availability (5 points)
    if (onChain.uri) score += 5;

    // IPFS metadata successfully fetched (10 points)
    if (ipfs) score += 10;

    // Creator verified (5 points) - would need to check on-chain
    // For now, just give points if creator exists
    // score += 5;

    return Math.min(100, score);
  }
}

export const ipfsClient = new IPFSClient();
