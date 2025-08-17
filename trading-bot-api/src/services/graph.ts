import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { EventEmitter } from 'events';
import { TokenPriceData } from '../types';

export interface GraphTokenBalance {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  };
  amount: string;
  formattedAmount: string;
  valueUSD?: number;
  chain: {
    id: number;
    name: string;
  };
}

export interface GraphHistoricalPrice {
  timestamp: number;
  price: number;
  volume24h?: number;
  marketCap?: number;
  token: {
    address: string;
    symbol: string;
    name: string;
  };
  chain: {
    id: number;
    name: string;
  };
}

export interface GraphTokenMetadata {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  verified: boolean;
  totalSupply?: string;
  holders?: number;
  chain: {
    id: number;
    name: string;
  };
}

export interface GraphTransfer {
  from: string;
  to: string;
  amount: string;
  formattedAmount: string;
  timestamp: number;
  txHash: string;
  token: {
    address: string;
    symbol: string;
    name: string;
  };
  chain: {
    id: number;
    name: string;
  };
}

export interface GraphAPIError {
  code: string;
  message: string;
  details?: any;
}

// Actual API response format based on testing
interface GraphAPIResponse {
  data: Array<{
    block_num: number;
    last_balance_update: string;
    contract: string;
    amount: string;
    value: number;
    name: string;
    symbol: string;
    decimals: number;
    network_id: string;
  }>;
  statistics: {
    bytes_read: number;
    rows_read: number;
    elapsed: number;
  };
  pagination: {
    previous_page: number;
    current_page: number;
    next_page: number;
    total_pages: number;
  };
  results: number;
  total_results: number;
  request_time: string;
  duration_ms: number;
}

export class GraphService extends EventEmitter {
  private client: AxiosInstance;
  private apiToken: string;
  private baseURL: string = 'https://token-api.thegraph.com';
  private rateLimitDelay: number = 100; // ms between requests
  private lastRequestTime: number = 0;

  constructor(apiToken?: string) {
    super();
    
    // Use provided token or environment variable
    this.apiToken = apiToken || process.env.GRAPH_API_KEY || '';
    
    if (!this.apiToken) {
      throw new Error('Graph API token is required. Provide it as constructor parameter or set GRAPH_API_KEY environment variable.');
    }
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('🔴 Graph API Error:', error.response?.data || error.message);
        this.emit('error', {
          code: error.response?.status || 'UNKNOWN',
          message: error.response?.data?.message || error.message,
          details: error.response?.data
        });
        throw error;
      }
    );
  }

  private async rateLimitedRequest<T>(requestFn: () => Promise<AxiosResponse<T>>): Promise<T> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    const response = await requestFn();
    return response.data;
  }

  /**
   * Get token balances for a wallet address
   */
  async getWalletBalances(
    walletAddress: string,
    chainId?: number,
    includeNative: boolean = true
  ): Promise<GraphTokenBalance[]> {
    try {
      console.log(`📊 Fetching wallet balances for ${walletAddress}${chainId ? ` on chain ${chainId}` : ''}`);
      
      // The API uses network_id instead of chainId in the current implementation
      let endpoint = `/balances/evm/${walletAddress}`;
      
      const data = await this.rateLimitedRequest(() => 
        this.client.get<GraphAPIResponse>(endpoint)
      );

      const balances: GraphTokenBalance[] = [];

      if (data.data) {
        for (const balance of data.data) {
          // Skip native ETH if includeNative is false
          if (!includeNative && balance.contract === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
            continue;
          }

          // Convert the API response to our interface format
          const formattedAmount = this.formatTokenAmount(balance.amount, balance.decimals);
          
          balances.push({
            token: {
              address: balance.contract,
              symbol: balance.symbol,
              name: balance.name,
              decimals: balance.decimals
            },
            amount: balance.amount,
            formattedAmount: formattedAmount,
            valueUSD: balance.value,
            chain: {
              id: balance.network_id === 'mainnet' ? 1 : 0, // Map network_id to chainId
              name: balance.network_id === 'mainnet' ? 'Ethereum' : balance.network_id
            }
          });
        }
      }

      console.log(`✅ Retrieved ${balances.length} token balances`);
      this.emit('balancesFetched', { walletAddress, chainId, balances });
      
      return balances;
    } catch (error) {
      console.error(`❌ Failed to fetch wallet balances for ${walletAddress}:`, error);
      throw new Error(`Failed to fetch wallet balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Graph historical data to TokenPriceData format for compatibility
   */
  convertToTokenPriceData(balances: GraphTokenBalance[]): TokenPriceData[] {
    return balances.map(balance => ({
      timestamp: Date.now() / 1000, // Current timestamp since we don't have historical data
      price: balance.valueUSD || 0,
      marketDepthUSDUp: 0, // Not available in Graph API
      marketDepthUSDDown: 0, // Not available in Graph API
      volume24h: 0, // Not available in current API
      baseSymbol: balance.token.symbol,
      quoteSymbol: 'USD'
    }));
  }

  /**
   * Get aggregated wallet portfolio value
   */
  async getPortfolioValue(walletAddress: string, chainIds?: number[]): Promise<{
    totalValueUSD: number;
    balances: GraphTokenBalance[];
    chains: { [chainId: number]: number };
  }> {
    try {
      const balances = await this.getWalletBalances(walletAddress);

      let totalValueUSD = 0;
      const chainValues: { [chainId: number]: number } = {};

      for (const balance of balances) {
        const valueUSD = balance.valueUSD || 0;
        totalValueUSD += valueUSD;
        
        if (!chainValues[balance.chain.id]) {
          chainValues[balance.chain.id] = 0;
        }
        chainValues[balance.chain.id] += valueUSD;
      }

      console.log(`💰 Portfolio value for ${walletAddress}: $${totalValueUSD.toFixed(2)}`);
      
      return {
        totalValueUSD,
        balances: balances,
        chains: chainValues
      };
    } catch (error) {
      console.error(`❌ Failed to calculate portfolio value for ${walletAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get supported chains and their information
   */
  getSupportedChains(): { [chainId: number]: string } {
    return {
      1: 'Ethereum',
      10: 'Optimism',
      25: 'Cronos',
      56: 'BSC',
      100: 'Gnosis',
      137: 'Polygon',
      169: 'Manta Pacific',
      288: 'Boba',
      324: 'zkSync Era',
      8453: 'Base',
      42161: 'Arbitrum One',
      43114: 'Avalanche',
      59144: 'Linea',
      534352: 'Scroll',
      7777777: 'Zora'
    };
  }

  /**
   * Get chain name by ID
   */
  private getChainName(chainId: number): string {
    const chains = this.getSupportedChains();
    return chains[chainId] || `Chain ${chainId}`;
  }

  /**
   * Validate if a chain is supported by The Graph Token API
   */
  isChainSupported(chainId: number): boolean {
    return chainId in this.getSupportedChains();
  }

  /**
   * Format token amount based on decimals
   */
  private formatTokenAmount(amount: string, decimals: number): string {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    if (remainder === 0n) {
      return quotient.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    
    if (trimmedRemainder === '') {
      return quotient.toString();
    }
    
    return `${quotient}.${trimmedRemainder}`;
  }

  /**
   * Get API status and rate limit information
   */
  async getAPIStatus(): Promise<{
    status: string;
    rateLimitRemaining?: number;
    rateLimitReset?: number;
  }> {
    try {
      // Test with a simple request since there's no dedicated status endpoint
      const response = await this.client.get('/balances/evm/0x0000000000000000000000000000000000000000');
      return {
        status: 'active',
        rateLimitRemaining: parseInt(response.headers['x-ratelimit-remaining'] || '0'),
        rateLimitReset: parseInt(response.headers['x-ratelimit-reset'] || '0')
      };
    } catch (error) {
      return {
        status: 'error'
      };
    }
  }

  // Placeholder methods for features not yet available in the current API
  async getHistoricalPrices(
    tokenAddress: string,
    chainId: number,
    timeframe: string = '1h',
    limit: number = 100
  ): Promise<GraphHistoricalPrice[]> {
    console.warn('⚠️  Historical prices not yet available in The Graph Token API');
    return [];
  }

  async getTokenInfo(
    tokenAddress: string,
    chainId: number
  ): Promise<GraphTokenMetadata> {
    console.warn('⚠️  Token info endpoint not yet available in The Graph Token API');
    throw new Error('Token info endpoint not yet implemented');
  }

  async getTokenTransfers(
    walletAddress: string,
    chainId?: number,
    tokenAddress?: string,
    limit: number = 50
  ): Promise<GraphTransfer[]> {
    console.warn('⚠️  Token transfers not yet available in The Graph Token API');
    return [];
  }

  async searchTokens(
    query: string,
    chainId?: number,
    limit: number = 20
  ): Promise<GraphTokenMetadata[]> {
    console.warn('⚠️  Token search not yet available in The Graph Token API');
    return [];
  }
}
