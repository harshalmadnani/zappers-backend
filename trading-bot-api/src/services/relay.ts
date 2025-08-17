import axios from 'axios';

// Relay API Types based on the documentation
export interface RelayQuoteRequest {
  user: string;
  recipient: string;
  originChainId: number;
  destinationChainId: number;
  originCurrency: string;
  destinationCurrency: string;
  amount: string;
  tradeType?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  txs?: Array<{
    to: string;
    value: string;
    data: string;
  }>;
  txsGasLimit?: number;
  authorizationList?: Array<{
    chainId: number;
    address: string;
    nonce: number;
    yParity: number;
    r: string;
    s: string;
  }>;
  additionalData?: {
    userPublicKey?: string;
  };
  referrer?: string;
  referrerAddress?: string;
  refundTo?: string;
  refundOnOrigin?: boolean;
  topupGas?: boolean;
  topupGasAmount?: string;
  useReceiver?: boolean;
  enableTrueExactOutput?: boolean;
  protocolVersion?: string;
  explicitDeposit?: boolean;
  useExternalLiquidity?: boolean;
  useFallbacks?: boolean;
  usePermit?: boolean;
  useDepositAddress?: boolean;
  slippageTolerance?: string;
  latePaymentSlippageTolerance?: string;
  appFees?: Array<{
    recipient: string;
    fee: string;
  }>;
  gasLimitForDepositSpecifiedTxs?: number;
  forceSolverExecution?: boolean;
  subsidizeFees?: boolean;
  maxSubsidizationAmount?: string;
  includedSwapSources?: string[];
  excludedSwapSources?: string[];
  originGasOverhead?: number;
  depositFeePayer?: string;
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

export interface RelayAmount {
  currency: RelayCurrency;
  amount: string;
  amountFormatted: string;
  amountUsd: string;
  minimumAmount: string;
}

export interface RelayQuoteStep {
  id: string;
  action: string;
  description: string;
  kind: string;
  requestId: string;
  items: Array<{
    status: string;
    data: {
      from: string;
      to: string;
      data: string;
      value: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      chainId: number;
    };
    check: {
      endpoint: string;
      method: string;
    };
  }>;
}

export interface RelayQuoteResponse {
  steps: RelayQuoteStep[];
  fees: {
    gas: RelayAmount;
    relayer: RelayAmount;
    relayerGas: RelayAmount;
    relayerService: RelayAmount;
    app: RelayAmount;
    subsidized: RelayAmount;
  };
  details: {
    operation: string;
    sender: string;
    recipient: string;
    currencyIn: RelayAmount;
    currencyOut: RelayAmount;
    currencyGasTopup: RelayAmount;
    totalImpact: {
      usd: string;
      percent: string;
    };
    swapImpact: {
      usd: string;
      percent: string;
    };
    expandedPriceImpact: {
      swap: { usd: string };
      execution: { usd: string };
      relay: { usd: string };
      app: { usd: string };
    };
    rate: string;
    slippageTolerance: {
      origin: {
        usd: string;
        value: string;
        percent: string;
      };
      destination: {
        usd: string;
        value: string;
        percent: string;
      };
    };
    timeEstimate: number;
    userBalance: string;
    fallbackType: string;
  };
  protocol: {
    v2: {
      orderId: string;
      paymentDetails: {
        chainId: string;
        depository: string;
        currency: string;
        amount: string;
      };
    };
  };
}

export interface RelayExecutionRequest {
  user: string;
  txs: Array<{
    to: string;
    value: string;
    data: string;
    gasLimit?: string;
  }>;
  source: string;
}

export interface RelayExecutionResponse {
  requestId: string;
  status: string;
  steps: RelayQuoteStep[];
}

export interface RelayExecutionStatus {
  requestId: string;
  status: 'pending' | 'success' | 'failure';
  txHash?: string;
  error?: string;
  details?: any;
}

// Chain ID mappings for popular networks
export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  BASE: 8453,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BSC: 56,
  AVALANCHE: 43114,
} as const;

// Common token addresses for different chains
export const TOKEN_ADDRESSES = {
  [CHAIN_IDS.ETHEREUM]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xa0b86a33e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6',
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  [CHAIN_IDS.POLYGON]: {
    MATIC: '0x0000000000000000000000000000000000000000',
    USDC: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    USDT: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
    WETH: '0x7ceb23fd6c0b6c9b9b9b9b9b9b9b9b9b9b9b9b9b',
  },
  [CHAIN_IDS.BASE]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
    WETH: '0x4200000000000000000000000000000000000006',
  },
  [CHAIN_IDS.ARBITRUM]: {
    ETH: '0x0000000000000000000000000000000000000000',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    WETH: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
  },
} as const;

export interface RelaySwapRequest {
  senderAddress: string;
  senderPrivateKey: string;
  recipientAddress: string;
  originSymbol: string;
  originBlockchain: string;
  destinationSymbol: string;
  destinationBlockchain: string;
  amount: string;
  isTest?: boolean;
}

export interface RelayAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
  txHash?: string;
}

export class RelayService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'https://api.relay.link', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  private getChainId(blockchain: string): number {
    const chainMap: Record<string, number> = {
      'ethereum': CHAIN_IDS.ETHEREUM,
      'polygon': CHAIN_IDS.POLYGON,
      'base': CHAIN_IDS.BASE,
      'arbitrum': CHAIN_IDS.ARBITRUM,
      'optimism': CHAIN_IDS.OPTIMISM,
      'bsc': CHAIN_IDS.BSC,
      'avalanche': CHAIN_IDS.AVALANCHE,
    };

    const chainId = chainMap[blockchain.toLowerCase()];
    if (!chainId) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    return chainId;
  }

  private getTokenAddress(chainId: number, symbol: string): string {
    // This is a simplified mapping - in production, you'd want a more comprehensive token registry
    const chainTokens = TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES];
    if (!chainTokens) {
      throw new Error(`No token mappings available for chain ID: ${chainId}`);
    }

    const address = chainTokens[symbol.toUpperCase() as keyof typeof chainTokens];
    if (!address) {
      throw new Error(`Token ${symbol} not found for chain ID: ${chainId}`);
    }

    return address;
  }

  async getQuote(swapRequest: RelaySwapRequest): Promise<RelayQuoteResponse> {
    try {
      console.log('🔄 Getting quote from Relay API...');
      console.log(`   ${swapRequest.amount} ${swapRequest.originSymbol} (${swapRequest.originBlockchain}) → ${swapRequest.destinationSymbol} (${swapRequest.destinationBlockchain})`);

      const originChainId = this.getChainId(swapRequest.originBlockchain);
      const destinationChainId = this.getChainId(swapRequest.destinationBlockchain);
      const originCurrency = this.getTokenAddress(originChainId, swapRequest.originSymbol);
      const destinationCurrency = this.getTokenAddress(destinationChainId, swapRequest.destinationSymbol);

      const quoteRequest: RelayQuoteRequest = {
        user: swapRequest.senderAddress,
        recipient: swapRequest.recipientAddress,
        originChainId,
        destinationChainId,
        originCurrency,
        destinationCurrency,
        amount: swapRequest.amount,
        tradeType: 'EXACT_INPUT',
        refundOnOrigin: true,
        topupGas: true,
        useExternalLiquidity: true,
        useFallbacks: true,
        protocolVersion: 'v1',
      };

      const response = await axios.post(`${this.baseUrl}/quote`, quoteRequest, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

      console.log('✅ Quote received successfully');
      return response.data;

    } catch (error) {
      console.error('❌ Relay quote error:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || error.message;
        throw new Error(`Relay Quote Error: ${errorMessage}`);
      }

      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async executeSwap(swapRequest: RelaySwapRequest): Promise<RelayAPIResponse> {
    try {
      console.log('🔄 Executing swap via Relay API...');
      console.log(`   ${swapRequest.amount} ${swapRequest.originSymbol} (${swapRequest.originBlockchain}) → ${swapRequest.destinationSymbol} (${swapRequest.destinationBlockchain})`);

      // First, get a quote to understand the transaction details
      const quote = await this.getQuote(swapRequest);
      
      if (!quote.steps || quote.steps.length === 0) {
        throw new Error('No execution steps returned from quote');
      }

      console.log(`📋 Executing ${quote.steps.length} transaction steps...`);

      // Execute all transaction steps
      const executionResults = [];
      
      for (let i = 0; i < quote.steps.length; i++) {
        const step = quote.steps[i];
        console.log(`🔄 Executing Step ${i + 1}: ${step.action}`);

        if (step.kind === 'transaction' && step.items && step.items.length > 0) {
          const txItem = step.items[0];
          
          if (txItem.data) {
            // Execute the actual blockchain transaction
            const txResult = await this.executeBlockchainTransaction(
              txItem.data, 
              swapRequest.senderPrivateKey,
              step.requestId
            );
            
            if (txResult) {
              console.log(`✅ Step ${i + 1} completed: ${txResult.hash}`);
              executionResults.push(txResult);
              
              // Monitor the transaction status for cross-chain swaps
              if (quote.steps.length > 1 || step.description.includes('cross-chain')) {
                await this.monitorTransactionStatus(step.requestId, txResult.hash);
              }
            } else {
              throw new Error(`Failed to execute transaction for step ${i + 1}`);
            }
          }
        }
      }

      const finalResult = executionResults[executionResults.length - 1];
      
      console.log('✅ Swap executed successfully');
      console.log(`   Final Transaction Hash: ${finalResult.hash}`);

      return {
        success: true,
        data: {
          quote,
          txHash: finalResult.hash,
          requestId: finalResult.requestId,
          status: 'success',
          allTransactions: executionResults,
        },
        requestId: finalResult.requestId,
        txHash: finalResult.hash,
      };

    } catch (error) {
      console.error('❌ Relay swap execution error:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async executeBlockchainTransaction(
    txData: any, 
    privateKey: string, 
    requestId: string
  ): Promise<{ hash: string; requestId: string; receipt?: any } | null> {
    try {
      // Dynamic import of ethers to avoid issues if not installed
      const { ethers } = await import('ethers');
      
      // Get the appropriate RPC URL based on chain ID
      const rpcUrl = this.getRpcUrl(txData.chainId);
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Verify wallet address matches
      if (wallet.address.toLowerCase() !== txData.from.toLowerCase()) {
        throw new Error(`Wallet address mismatch: ${wallet.address} vs ${txData.from}`);
      }

      // Get current gas price and nonce
      const [gasPrice, nonce] = await Promise.all([
        provider.getFeeData(),
        provider.getTransactionCount(wallet.address)
      ]);

      // Prepare transaction
      const transaction: any = {
        to: txData.to,
        value: txData.value || '0',
        data: txData.data || '0x',
        nonce: nonce,
        chainId: txData.chainId,
      };

      // Use EIP-1559 gas pricing if available
      if (txData.maxFeePerGas && txData.maxPriorityFeePerGas) {
        transaction.maxFeePerGas = txData.maxFeePerGas;
        transaction.maxPriorityFeePerGas = txData.maxPriorityFeePerGas;
        transaction.type = 2; // EIP-1559
      } else if (gasPrice.gasPrice) {
        transaction.gasPrice = gasPrice.gasPrice;
      }

      // Estimate gas limit
      try {
        const estimatedGas = await provider.estimateGas(transaction);
        transaction.gasLimit = estimatedGas;
        console.log(`⛽ Estimated gas: ${estimatedGas.toString()}`);
      } catch (gasError) {
        console.warn('⚠️  Gas estimation failed, using provided gas limit');
        transaction.gasLimit = txData.gasLimit || '21000';
      }

      // Check balance before sending
      const balance = await provider.getBalance(wallet.address);
      const totalCost = BigInt(transaction.value || '0') + 
                       (BigInt(transaction.gasLimit || '21000') * BigInt(transaction.gasPrice || transaction.maxFeePerGas || '0'));
      
      console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
      console.log(`💸 Transaction cost: ${ethers.formatEther(totalCost)} ETH`);

      if (balance < totalCost) {
        throw new Error('Insufficient balance for transaction');
      }

      // Send transaction
      console.log('📤 Sending transaction...');
      const txResponse = await wallet.sendTransaction(transaction);
      
      console.log(`✅ Transaction sent: ${txResponse.hash}`);
      console.log('⏳ Waiting for confirmation...');
      
      // Wait for confirmation
      const receipt = await txResponse.wait(1);
      
      if (receipt) {
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      }

      return {
        hash: txResponse.hash,
        receipt: receipt,
        requestId: requestId
      };

    } catch (error) {
      console.error('❌ Blockchain transaction error:', error);
      return null;
    }
  }

  private getRpcUrl(chainId: number): string {
    const rpcUrls: Record<number, string> = {
      [CHAIN_IDS.ETHEREUM]: 'https://eth.llamarpc.com',
      [CHAIN_IDS.POLYGON]: 'https://polygon-rpc.com',
      [CHAIN_IDS.BASE]: 'https://mainnet.base.org',
      [CHAIN_IDS.ARBITRUM]: 'https://arb1.arbitrum.io/rpc',
      [CHAIN_IDS.OPTIMISM]: 'https://mainnet.optimism.io',
    };

    const rpcUrl = rpcUrls[chainId];
    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for chain ID: ${chainId}`);
    }

    return rpcUrl;
  }

  private async monitorTransactionStatus(requestId: string, txHash: string): Promise<boolean> {
    console.log(`🔍 Monitoring cross-chain transaction status...`);
    
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const status = await this.getExecutionStatus(requestId);

        console.log(`📊 Status check ${attempts + 1}: ${status.status}`);

        if (status.status === 'success') {
          console.log('✅ Cross-chain swap completed successfully!');
          return true;
        } else if (status.status === 'failure') {
          console.error(`❌ Cross-chain swap failed: ${status.error}`);
          return false;
        } else if (status.status === 'pending') {
          console.log(`⏳ Cross-chain swap still processing...`);
        }

      } catch (error) {
        console.warn(`⚠️  Status check failed: ${error}`);
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }

    console.warn('⏰ Status monitoring timed out');
    return false;
  }

  async getExecutionStatus(requestId: string): Promise<RelayExecutionStatus> {
    try {
      console.log(`🔍 Checking execution status for request: ${requestId}`);
      
      const response = await axios.get(`${this.baseUrl}/intents/status`, {
        params: { requestId },
        headers: this.getHeaders(),
        timeout: 10000,
      });

      return {
        requestId,
        status: response.data.status || 'pending',
        txHash: response.data.txHash,
        error: response.data.error,
        details: response.data,
      };

    } catch (error) {
      console.error('Error checking execution status:', error);
      return {
        requestId,
        status: 'failure',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getSupportedChains(): Promise<Array<{ chainId: number; name: string }>> {
    try {
      const response = await axios.get(`${this.baseUrl}/chains`, {
        headers: this.getHeaders(),
      });
      
      return response.data.chains || Object.entries(CHAIN_IDS).map(([name, chainId]) => ({
        chainId,
        name: name.toLowerCase(),
      }));
    } catch (error) {
      console.error('Error fetching supported chains:', error);
      // Return default supported chains
      return Object.entries(CHAIN_IDS).map(([name, chainId]) => ({
        chainId,
        name: name.toLowerCase(),
      }));
    }
  }

  async getCurrencies(chainIds?: number[]): Promise<RelayCurrency[]> {
    try {
      const requestBody: any = {};
      if (chainIds) {
        requestBody.chainIds = chainIds;
      }

      const response = await axios.post(`${this.baseUrl}/currencies`, requestBody, {
        headers: this.getHeaders(),
      });
      
      return response.data.currencies || [];
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        headers: this.getHeaders(),
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Relay health check failed:', error);
      return false;
    }
  }

  // Helper method to validate swap request
  validateSwapRequest(swapRequest: RelaySwapRequest): string[] {
    const errors: string[] = [];

    if (!swapRequest.senderAddress) {
      errors.push('Sender address is required');
    }

    if (!swapRequest.senderPrivateKey) {
      errors.push('Sender private key is required');
    }

    if (!swapRequest.recipientAddress) {
      errors.push('Recipient address is required');
    }

    if (!swapRequest.originSymbol) {
      errors.push('Origin token symbol is required');
    }

    if (!swapRequest.originBlockchain) {
      errors.push('Origin blockchain is required');
    }

    if (!swapRequest.destinationSymbol) {
      errors.push('Destination token symbol is required');
    }

    if (!swapRequest.destinationBlockchain) {
      errors.push('Destination blockchain is required');
    }

    if (!swapRequest.amount || isNaN(parseFloat(swapRequest.amount)) || parseFloat(swapRequest.amount) <= 0) {
      errors.push('Valid amount is required');
    }

    // Validate supported blockchains
    try {
      this.getChainId(swapRequest.originBlockchain);
    } catch {
      errors.push(`Unsupported origin blockchain: ${swapRequest.originBlockchain}`);
    }

    try {
      this.getChainId(swapRequest.destinationBlockchain);
    } catch {
      errors.push(`Unsupported destination blockchain: ${swapRequest.destinationBlockchain}`);
    }

    return errors;
  }

  // Method to estimate swap output
  async getSwapQuote(
    originSymbol: string,
    originBlockchain: string,
    destinationSymbol: string,
    destinationBlockchain: string,
    amount: string
  ): Promise<any> {
    try {
      console.log(`💭 Getting quote for ${amount} ${originSymbol} → ${destinationSymbol}`);
      
      const swapRequest: RelaySwapRequest = {
        senderAddress: '0x0000000000000000000000000000000000000000', // Placeholder for quote
        senderPrivateKey: '', // Not needed for quote
        recipientAddress: '0x0000000000000000000000000000000000000000', // Placeholder for quote
        originSymbol,
        originBlockchain,
        destinationSymbol,
        destinationBlockchain,
        amount,
      };

      const quote = await this.getQuote(swapRequest);
      
      return {
        estimatedOutput: quote.details.currencyOut.amountFormatted,
        exchangeRate: quote.details.rate,
        fees: {
          gas: quote.fees.gas.amountFormatted,
          relayer: quote.fees.relayer.amountFormatted,
          total: quote.fees.gas.amountUsd,
        },
        timeEstimate: quote.details.timeEstimate,
        priceImpact: quote.details.totalImpact.percent,
      };
    } catch (error) {
      console.error('Error getting swap quote:', error);
      return null;
    }
  }
}
