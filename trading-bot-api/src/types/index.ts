export interface TokenPriceData {
  timestamp: number;
  price: number;
  marketDepthUSDUp: number;
  marketDepthUSDDown: number;
  volume24h: number;
  baseSymbol: string;
  quoteSymbol: string;
}

export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  type: 'price_threshold' | 'price_range' | 'interval' | 'custom';
  parameters: {
    targetCoin?: string; // e.g., "SOL", "BTC", "ETH"
    buyThreshold?: number;
    sellThreshold?: number;
    minPrice?: number;
    maxPrice?: number;
    interval?: number | string; // in milliseconds or string like "1m", "5m", "1h"
    amount?: string;
    customLogic?: string;
  };
}

export interface SwapRequest {
  senderAddress: string;
  senderPrivateKey: string;
  recipientAddress: string;
  originSymbol: string;
  originBlockchain: string;
  destinationSymbol: string;
  destinationBlockchain?: string; // Made optional as requested
  amount: string;
  isTest?: boolean;
  // Relay-specific optional fields
  slippageTolerance?: string;
  referrer?: string;
  referrerAddress?: string;
}

export interface TradingBot {
  id: string;
  name: string;
  strategy: TradingStrategy;
  swapConfig: SwapRequest;
  isActive: boolean;
  createdAt: Date;
  lastExecution?: Date;
  executionCount: number;
  generatedCode: string;
  vercelDeploymentUrl?: string;
}

export interface BotCreationRequest {
  name: string;
  prompt: string;
  targetCoin?: string; // e.g., "SOL", "BTC", "ETH" - defaults to "SOL"
  swapConfig: SwapRequest;
  strategy?: Partial<TradingStrategy>;
  userWallet?: string; // User's wallet address for tracking ownership
}

export interface BotExecutionLog {
  botId: string;
  timestamp: Date;
  action: 'buy' | 'sell' | 'hold';
  price: number;
  amount?: string;
  txHash?: string;
  success: boolean;
  error?: string;
}

export interface HyperliquidWebSocketMessage {
  method: string;
  subscription: {
    type: string;
    coin: string;
  };
}

export interface PriceCondition {
  type: 'above' | 'below' | 'between' | 'change_percent';
  value: number;
  value2?: number; // for 'between' conditions
  timeframe?: number; // for change_percent conditions
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Relay-specific types
export interface RelaySwapResponse {
  success: boolean;
  data?: {
    quote: any;
    txHash: string;
    requestId: string;
    status: string;
  };
  error?: string;
  requestId?: string;
  txHash?: string;
}

export interface RelayCurrency {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  metadata: {
    logoURI: string;
    verified: boolean;
    isNative: boolean;
  };
}

export interface RelayChain {
  chainId: number;
  name: string;
  displayName?: string;
  nativeCurrency?: RelayCurrency;
}