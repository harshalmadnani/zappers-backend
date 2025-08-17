import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { TradingBot, BotCreationRequest, BotExecutionLog, TokenPriceData, SwapRequest } from '../types';
import { OpenAIService } from './openai';
import { HyperliquidWebSocketService } from './hyperliquid';
import { RelayService } from './relay';
import { VercelDeployService } from './vercel-deploy';
import { StorageService } from './storage';
import { SupabaseService, AgentRecord } from './supabase';
import { GraphService } from './graph';

export class BotManager extends EventEmitter {
  private bots: Map<string, TradingBot> = new Map();
  private executionLogs: Map<string, BotExecutionLog[]> = new Map();
  private priceHistory: TokenPriceData[] = [];
  private activeConnections: Map<string, HyperliquidWebSocketService> = new Map();
  private lastFailureTime: Map<string, Date> = new Map(); // Track last failure per bot

  private openaiService: OpenAIService;
  private relayService: RelayService;
  private vercelService: VercelDeployService;
  private storageService: StorageService;
  private supabaseService: SupabaseService;
  private graphService: GraphService | null = null; // Optional Graph API service
  private targetCoin: string;
  private isTestnet: boolean;
  private botToAgentMap: Map<string, number> = new Map(); // Map bot ID to Supabase agent ID
  
  // Retry configuration
  private readonly RETRY_DELAY_MS = 30000; // 30 seconds

  constructor(
    openaiApiKey: string,
    vercelToken: string,
    relayApiKey?: string,
    targetCoin: string = 'SOL',
    isTestnet: boolean = false,
    graphApiKey?: string
  ) {
    super();
    this.openaiService = new OpenAIService(openaiApiKey);
    this.relayService = new RelayService('https://api.relay.link', relayApiKey);
    this.vercelService = new VercelDeployService(vercelToken);
    this.storageService = new StorageService();
    this.supabaseService = new SupabaseService();
    
    // Initialize Graph service only if API key is provided
    if (graphApiKey) {
      this.graphService = new GraphService(graphApiKey);
      console.log('📊 Graph API service initialized');
    }
    
    this.targetCoin = targetCoin;
    this.isTestnet = isTestnet;
    
    // Load existing bots and logs on startup
    this.initializeFromStorage();
  }

  private async initializeFromStorage(): Promise<void> {
    try {
      console.log('🔄 Loading bots from Supabase and local storage...');
      
      // Test Supabase connection
      const supabaseConnected = await this.supabaseService.testConnection();
      
      if (supabaseConnected) {
        // Load active bots from Supabase
        console.log('📡 Loading active bots from Supabase...');
        const activeAgents = await this.supabaseService.getAllActiveAgents();
        
        for (const agent of activeAgents) {
          try {
            const bot = this.supabaseService.agentRecordToBot(agent);
            this.bots.set(bot.id, bot);
            this.botToAgentMap.set(bot.id, agent.id!);
            console.log(`📥 Loaded bot from Supabase: ${bot.name} (Agent ID: ${agent.id})`);
          } catch (error) {
            console.error(`❌ Failed to load agent ${agent.id}:`, error);
          }
        }
      } else {
        console.warn('⚠️  Supabase connection failed, falling back to local storage');
      }
      
      // Also load from local storage as backup
      const localBots = await this.storageService.loadBots();
      const localLogs = await this.storageService.loadExecutionLogs();
      
      // Merge local bots that aren't already loaded from Supabase
      for (const [botId, bot] of localBots) {
        if (!this.bots.has(botId)) {
          this.bots.set(botId, bot);
          console.log(`📥 Loaded bot from local storage: ${bot.name}`);
        }
      }
      
      this.executionLogs = localLogs;
      
      // Reactivate any bots that were active before shutdown
      const activeBots = Array.from(this.bots.values()).filter(bot => bot.isActive);
      console.log(`🔄 Found ${activeBots.length} active bots to reactivate`);
      
      for (const bot of activeBots) {
        try {
          await this.activateBot(bot.id);
          console.log(`✅ Reactivated bot: ${bot.name}`);
        } catch (error) {
          console.error(`❌ Failed to reactivate bot ${bot.name}:`, error);
        }
      }
      
      console.log(`✅ Initialization complete: ${this.bots.size} bots loaded, ${activeBots.length} reactivated`);
      
    } catch (error) {
      console.error('❌ Failed to initialize from storage:', error);
    }
  }

  async createBot(request: BotCreationRequest): Promise<TradingBot> {
    try {
      console.log(`🤖 Creating trading bot: ${request.name}`);
      
      // Use targetCoin from request or default to SOL
      const targetCoin = request.targetCoin || 'SOL';
      console.log(`🎯 Target coin: ${targetCoin}`);

      // Validate swap configuration - convert to RelaySwapRequest format
      const relaySwapRequest = {
        ...request.swapConfig,
        destinationBlockchain: request.swapConfig.destinationBlockchain || request.swapConfig.originBlockchain
      };
      const validationErrors = this.relayService.validateSwapRequest(relaySwapRequest);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid swap configuration: ${validationErrors.join(', ')}`);
      }

      // Generate bot code using OpenAI
      const generatedBot = await this.openaiService.generateTradingBot(request);

      // Create bot instance
      const bot: TradingBot = {
        id: uuidv4(),
        name: request.name,
        strategy: {
          ...generatedBot.strategy,
          parameters: {
            ...generatedBot.strategy.parameters,
            targetCoin: targetCoin
          }
        },
        swapConfig: request.swapConfig,
        isActive: false,
        createdAt: new Date(),
        executionCount: 0,
        generatedCode: generatedBot.code
      };

      // Deploy to Vercel
      const environmentVariables = this.vercelService.generateBotEnvironmentVariables(
        process.env.OPENAI_API_KEY || '',
        '', // No API key needed for Hyperliquid
        'https://api.relay.link', // Relay API URL
        targetCoin, // Use the targetCoin from request
        request.swapConfig
      );

      const deployment = await this.vercelService.deployBot(
        bot.id,
        bot.name,
        bot.generatedCode,
        environmentVariables
      );

      bot.vercelDeploymentUrl = deployment.url;

      // Store bot
      this.bots.set(bot.id, bot);
      this.executionLogs.set(bot.id, []);

      // Save to Supabase if user wallet is provided
      if (request.userWallet) {
        try {
          const agentRecord = await this.supabaseService.saveAgent(request.userWallet, bot);
          this.botToAgentMap.set(bot.id, agentRecord.id!);
          console.log(`💾 Bot saved to Supabase with Agent ID: ${agentRecord.id}`);
        } catch (error) {
          console.error('⚠️  Failed to save to Supabase, continuing with local storage:', error);
        }
      }

      // Persist to local storage as backup
      await this.storageService.saveBots(this.bots);
      await this.storageService.saveExecutionLogs(this.executionLogs);

      console.log(`✅ Bot "${bot.name}" created successfully!`);
      console.log(`🔗 Deployment URL: ${bot.vercelDeploymentUrl}`);
      if (request.userWallet) {
        console.log(`👤 Associated with user wallet: ${request.userWallet}`);
      }

      this.emit('botCreated', bot);
      return bot;

    } catch (error) {
      console.error('❌ Failed to create bot:', error);
      throw error;
    }
  }

  async activateBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    if (bot.isActive) {
      console.log(`Bot ${bot.name} is already active`);
      return;
    }

    try {
      // Create WebSocket connection for this bot with its specific target coin
      const botTargetCoin = bot.strategy?.parameters?.targetCoin || this.targetCoin;
      const wsService = new HyperliquidWebSocketService(botTargetCoin, this.isTestnet);
      
      // Set up price monitoring
      wsService.on('priceUpdate', (priceData: TokenPriceData) => {
        this.handlePriceUpdate(bot, priceData);
      });

      wsService.on('connected', () => {
        console.log(`📡 Hyperliquid WebSocket connected for bot: ${bot.name}`);
      });

      wsService.on('error', async (error) => {
        console.error(`Hyperliquid WebSocket error for bot ${bot.name}:`, error);
        await this.logExecution(bot.id, 'hold', 0, undefined, undefined, false, `WebSocket error: ${error.message}`);
      });

      // Connect to WebSocket
      await wsService.connect();
      this.activeConnections.set(botId, wsService);

      // Mark bot as active
      bot.isActive = true;
      bot.lastExecution = new Date();

      // Update in Supabase if available
      const agentId = this.botToAgentMap.get(bot.id);
      if (agentId) {
        try {
          await this.supabaseService.updateAgentStatus(agentId, true, bot);
          console.log(`💾 Updated agent ${agentId} status in Supabase`);
        } catch (error) {
          console.error('⚠️  Failed to update Supabase, continuing:', error);
        }
      }

      // Persist updated bot state to local storage
      await this.storageService.saveBot(bot);

      console.log(`🚀 Bot "${bot.name}" activated successfully`);
      this.emit('botActivated', bot);

    } catch (error) {
      console.error(`Failed to activate bot ${bot.name}:`, error);
      throw error;
    }
  }

  async deactivateBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    if (!bot.isActive) {
      console.log(`Bot ${bot.name} is already inactive`);
      return;
    }

    // Disconnect WebSocket
    const wsService = this.activeConnections.get(botId);
    if (wsService) {
      await wsService.disconnect();
      this.activeConnections.delete(botId);
    }

    // Mark bot as inactive
    bot.isActive = false;

    // Update in Supabase if available
    const agentId = this.botToAgentMap.get(bot.id);
    if (agentId) {
      try {
        await this.supabaseService.updateAgentStatus(agentId, false, bot);
        console.log(`💾 Updated agent ${agentId} status in Supabase`);
      } catch (error) {
        console.error('⚠️  Failed to update Supabase, continuing:', error);
      }
    }

    // Persist updated bot state to local storage
    await this.storageService.saveBot(bot);

    console.log(`⏹️ Bot "${bot.name}" deactivated`);
    this.emit('botDeactivated', bot);
  }

  async deleteBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    // Deactivate if active
    if (bot.isActive) {
      await this.deactivateBot(botId);
    }

    // Delete Vercel deployment
    if (bot.vercelDeploymentUrl) {
      const deploymentId = this.extractDeploymentId(bot.vercelDeploymentUrl);
      if (deploymentId) {
        await this.vercelService.deleteDeployment(deploymentId);
      }
    }

    // Remove from storage
    this.bots.delete(botId);
    this.executionLogs.delete(botId);

    console.log(`🗑️ Bot "${bot.name}" deleted`);
    this.emit('botDeleted', botId);
  }

  private async handlePriceUpdate(bot: TradingBot, priceData: TokenPriceData): Promise<void> {
    try {
      // Store price history
      this.priceHistory.push(priceData);
      // Keep only last 1000 price points
      if (this.priceHistory.length > 1000) {
        this.priceHistory = this.priceHistory.slice(-1000);
      }

      // Check trading conditions based on strategy
      const shouldExecuteTrade = await this.evaluateStrategy(bot, priceData);

      if (shouldExecuteTrade.execute && shouldExecuteTrade.action !== 'hold') {
        await this.executeTrade(bot, shouldExecuteTrade.action, priceData.price);
      }

    } catch (error) {
      console.error(`Error handling price update for bot ${bot.name}:`, error);
      await this.logExecution(
        bot.id,
        'hold',
        priceData.price,
        undefined,
        undefined,
        false,
        `Price handling error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async evaluateStrategy(
    bot: TradingBot,
    priceData: TokenPriceData
  ): Promise<{ execute: boolean; action: 'buy' | 'sell' | 'hold' }> {
    const { strategy } = bot;
    const currentPrice = priceData.price;

    // Check if bot is in retry cooldown after a failure
    const lastFailure = this.lastFailureTime.get(bot.id);
    if (lastFailure) {
      const timeSinceFailure = Date.now() - lastFailure.getTime();
      if (timeSinceFailure < this.RETRY_DELAY_MS) {
        const remainingTime = Math.ceil((this.RETRY_DELAY_MS - timeSinceFailure) / 1000);
        console.log(`⏳ Bot ${bot.name} in cooldown for ${remainingTime}s after previous failure`);
        return { execute: false, action: 'hold' };
      } else {
        // Cooldown period expired, clear the failure time
        this.lastFailureTime.delete(bot.id);
        console.log(`✅ Bot ${bot.name} cooldown expired, ready to trade again`);
      }
    }

    switch (strategy.type) {
      case 'price_threshold':
        if (strategy.parameters.buyThreshold && currentPrice <= strategy.parameters.buyThreshold) {
          return { execute: true, action: 'buy' };
        }
        if (strategy.parameters.sellThreshold && currentPrice >= strategy.parameters.sellThreshold) {
          return { execute: true, action: 'sell' };
        }
        break;

      case 'price_range':
        if (strategy.parameters.minPrice && currentPrice <= strategy.parameters.minPrice) {
          return { execute: true, action: 'buy' };
        }
        if (strategy.parameters.maxPrice && currentPrice >= strategy.parameters.maxPrice) {
          return { execute: true, action: 'sell' };
        }
        break;

      case 'interval':
        const timeSinceLastExecution = bot.lastExecution 
          ? Date.now() - bot.lastExecution.getTime()
          : Infinity;
        
        // Convert interval from string to milliseconds if needed
        let intervalMs: number = strategy.parameters.interval as number;
        if (typeof strategy.parameters.interval === 'string') {
          // Parse intervals like "1m", "5m", "1h", etc.
          const intervalString = strategy.parameters.interval;
          const match = intervalString.match(/^(\d+)([smh])$/);
          if (match) {
            const value = parseInt(match[1]);
            const unit = match[2];
            switch (unit) {
              case 's': intervalMs = value * 1000; break;
              case 'm': intervalMs = value * 60 * 1000; break;
              case 'h': intervalMs = value * 60 * 60 * 1000; break;
              default: intervalMs = 60000; // Default to 1 minute
            }
          } else {
            intervalMs = 60000; // Default to 1 minute if parsing fails
          }
        }
        
        if (intervalMs && timeSinceLastExecution >= intervalMs) {
          // For interval-based bots, always buy (as specified in the strategy)
          // "buys ETH on base using 1 USDC on Polygon every minute"
          return { 
            execute: true, 
            action: 'buy' 
          };
        }
        break;

      case 'custom':
        // For custom strategies, we could use AI to evaluate
        // This would require more complex logic
        break;
    }

    return { execute: false, action: 'hold' };
  }

  private async executeTrade(
    bot: TradingBot,
    action: 'buy' | 'sell',
    currentPrice: number
  ): Promise<void> {
    try {
      console.log(`💱 Executing ${action} trade for bot: ${bot.name} at price: $${currentPrice}`);

      // Prepare swap request based on action
      let swapRequest: SwapRequest;
      
      if (action === 'buy') {
        // Buy destination token (swap from origin to destination)
        swapRequest = { ...bot.swapConfig };
      } else {
        // Sell destination token (swap from destination to origin)
        swapRequest = {
          ...bot.swapConfig,
          originSymbol: bot.swapConfig.destinationSymbol,
          originBlockchain: bot.swapConfig.destinationBlockchain || bot.swapConfig.originBlockchain,
          destinationSymbol: bot.swapConfig.originSymbol,
          destinationBlockchain: bot.swapConfig.originBlockchain
        };
      }

      console.log(`📋 Swap request: ${swapRequest.amount} ${swapRequest.originSymbol} (${swapRequest.originBlockchain}) → ${swapRequest.destinationSymbol} (${swapRequest.destinationBlockchain})`);

      // Check if this is a cross-chain operation
      const isCrossChain = swapRequest.originBlockchain !== swapRequest.destinationBlockchain;
      if (isCrossChain) {
        console.log(`🌉 Cross-chain operation detected: ${swapRequest.originBlockchain} → ${swapRequest.destinationBlockchain}`);
      }

      // Execute swap with improved error handling - ensure destinationBlockchain is set
      const relaySwapRequest = {
        ...swapRequest,
        destinationBlockchain: swapRequest.destinationBlockchain || swapRequest.originBlockchain
      };
      const result = await this.relayService.executeSwap(relaySwapRequest);

      // Update bot statistics
      bot.executionCount++;
      bot.lastExecution = new Date();
      
      // Persist updated bot state
      await this.storageService.saveBot(bot);

      // Log execution with more details
      await this.logExecution(
        bot.id,
        action,
        currentPrice,
        swapRequest.amount,
        result.data?.txHash || result.txHash,
        result.success,
        result.error
      );

      if (result.success) {
        console.log(`✅ ${action} trade executed successfully for bot: ${bot.name}`);
        if (result.data?.txHash || result.txHash) {
          console.log(`📤 Transaction hash: ${result.data?.txHash || result.txHash}`);
        }
        
        // Clear any previous failure time on successful trade
        this.lastFailureTime.delete(bot.id);
        this.emit('tradeExecuted', {
          bot,
          action,
          price: currentPrice,
          result
        });
      } else {
        console.error(`❌ ${action} trade failed for bot: ${bot.name} - ${result.error}`);
        // Set failure time to trigger cooldown period
        this.lastFailureTime.set(bot.id, new Date());
        console.log(`🔄 Bot ${bot.name} entering ${this.RETRY_DELAY_MS / 1000}s cooldown after failure`);
      }

    } catch (error) {
      console.error(`Trade execution error for bot ${bot.name}:`, error);
      
      // Check if this is a cross-chain error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isCrossChainError = errorMessage.includes('Cross-chain') || errorMessage.includes('same-chain quote');
      
      if (isCrossChainError) {
        console.error(`🌉 Cross-chain operation failed for bot ${bot.name}: ${errorMessage}`);
        console.log(`💡 Consider using same-chain operations or checking if cross-chain route is supported`);
      }
      
      // Set failure time to trigger cooldown period
      this.lastFailureTime.set(bot.id, new Date());
      console.log(`🔄 Bot ${bot.name} entering ${this.RETRY_DELAY_MS / 1000}s cooldown after ${isCrossChainError ? 'cross-chain' : 'execution'} failure`);
      
      await this.logExecution(
        bot.id,
        action,
        currentPrice,
        undefined,
        undefined,
        false,
        errorMessage
      );
    }
  }

  private async logExecution(
    botId: string,
    action: 'buy' | 'sell' | 'hold',
    price: number,
    amount?: string,
    txHash?: string,
    success: boolean = true,
    error?: string
  ): Promise<void> {
    const log: BotExecutionLog = {
      botId,
      timestamp: new Date(),
      action,
      price,
      amount,
      txHash,
      success,
      error
    };

    const logs = this.executionLogs.get(botId) || [];
    logs.push(log);
    
    // Keep only last 100 logs per bot
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    this.executionLogs.set(botId, logs);

    // Persist execution log
    await this.storageService.logExecution(botId, log);

    console.log(`📝 Logged execution for bot ${botId}: ${action} at $${price} - ${success ? 'SUCCESS' : 'FAILED'}`);
  }

  // Utility methods
  getAllBots(): TradingBot[] {
    return Array.from(this.bots.values());
  }

  getBot(botId: string): TradingBot | undefined {
    return this.bots.get(botId);
  }

  getBotLogs(botId: string): BotExecutionLog[] {
    return this.executionLogs.get(botId) || [];
  }

  getPriceHistory(): TokenPriceData[] {
    return this.priceHistory.slice(); // Return copy
  }

  getActiveBots(): TradingBot[] {
    return Array.from(this.bots.values()).filter(bot => bot.isActive);
  }

  async getBotsByUserWallet(userWallet: string): Promise<TradingBot[]> {
    try {
      console.log(`🔍 Fetching bots for user wallet: ${userWallet}`);
      const agents = await this.supabaseService.getAgentsByWallet(userWallet);
      const bots: TradingBot[] = [];

      for (const agent of agents) {
        try {
          const bot = this.supabaseService.agentRecordToBot(agent);
          bots.push(bot);
        } catch (error) {
          console.error(`❌ Failed to parse agent ${agent.id}:`, error);
        }
      }

      console.log(`✅ Found ${bots.length} bots for wallet ${userWallet}`);
      return bots;

    } catch (error) {
      console.error('❌ Error fetching bots by wallet:', error);
      return [];
    }
  }

  private extractDeploymentId(url: string): string | null {
    // Extract deployment ID from Vercel URL
    const match = url.match(/https:\/\/([^.]+)\.vercel\.app/);
    return match ? match[1] : null;
  }

  async optimizeBot(botId: string): Promise<void> {
    const bot = this.bots.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    const logs = this.getBotLogs(botId);
    const marketData = this.getPriceHistory().slice(-50); // Last 50 price points

    try {
      const optimizedStrategy = await this.openaiService.optimizeStrategy(
        bot.strategy,
        logs,
        marketData
      );

      bot.strategy = optimizedStrategy;
      console.log(`🔧 Bot "${bot.name}" strategy optimized`);
      
      this.emit('botOptimized', bot);
    } catch (error) {
      console.error(`Failed to optimize bot ${bot.name}:`, error);
      throw error;
    }
  }

  async generateManualSwap(swapRequest: {
    fromToken: string;
    fromChain: string;
    fromChainId: number;
    fromAmount: string;
    toToken: string;
    toChain: string;
    toChainId: number;
    privateKey: string;
    senderAddress: string;
  }): Promise<string> {
    try {
      console.log(`🔧 Generating manual swap code for ${swapRequest.fromAmount} ${swapRequest.fromToken} → ${swapRequest.toToken}`);
      
      const swapCode = await this.openaiService.generateManualSwapCode(swapRequest);
      
      console.log(`✅ Manual swap code generated successfully`);
      return swapCode;
      
    } catch (error) {
      console.error('❌ Failed to generate manual swap code:', error);
      throw error;
    }
  }

  async executeManualSwap(swapConfig: SwapRequest): Promise<any> {
    try {
      console.log(`🚀 Executing manual swap: ${swapConfig.amount} ${swapConfig.originSymbol} → ${swapConfig.destinationSymbol}`);
      
      // Validate the swap configuration - ensure destinationBlockchain is set
      const relaySwapConfig = {
        ...swapConfig,
        destinationBlockchain: swapConfig.destinationBlockchain || swapConfig.originBlockchain
      };
      const validationErrors = this.relayService.validateSwapRequest(relaySwapConfig);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid swap configuration: ${validationErrors.join(', ')}`);
      }

      // Execute the swap using the relay service
      const result = await this.relayService.executeSwap(relaySwapConfig);
      
      if (result.success) {
        console.log(`✅ Manual swap executed successfully`);
        if (result.data?.txHash || result.txHash) {
          console.log(`📤 Transaction hash: ${result.data?.txHash || result.txHash}`);
        }
      } else {
        console.error(`❌ Manual swap failed: ${result.error}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Manual swap execution error:', error);
      throw error;
    }
  }

  // Graph API helper methods (only available if Graph service is initialized)
  
  /**
   * Get wallet balances using The Graph API
   */
  async getWalletBalances(walletAddress: string, chainId?: number) {
    if (!this.graphService) {
      throw new Error('Graph API service not initialized. Provide graphApiKey in constructor.');
    }
    
    return await this.graphService.getWalletBalances(walletAddress, chainId);
  }

  /**
   * Get historical prices for a token using The Graph API
   */
  async getHistoricalPrices(tokenAddress: string, chainId: number, timeframe: string = '1h', limit: number = 100) {
    if (!this.graphService) {
      throw new Error('Graph API service not initialized. Provide graphApiKey in constructor.');
    }
    
    return await this.graphService.getHistoricalPrices(tokenAddress, chainId, timeframe, limit);
  }

  /**
   * Get token information using The Graph API
   */
  async getTokenInfo(tokenAddress: string, chainId: number) {
    if (!this.graphService) {
      throw new Error('Graph API service not initialized. Provide graphApiKey in constructor.');
    }
    
    return await this.graphService.getTokenInfo(tokenAddress, chainId);
  }

  /**
   * Get portfolio value for a wallet using The Graph API
   */
  async getPortfolioValue(walletAddress: string, chainIds?: number[]) {
    if (!this.graphService) {
      throw new Error('Graph API service not initialized. Provide graphApiKey in constructor.');
    }
    
    return await this.graphService.getPortfolioValue(walletAddress, chainIds);
  }

  /**
   * Search for tokens using The Graph API
   */
  async searchTokens(query: string, chainId?: number, limit: number = 20) {
    if (!this.graphService) {
      throw new Error('Graph API service not initialized. Provide graphApiKey in constructor.');
    }
    
    return await this.graphService.searchTokens(query, chainId, limit);
  }

  /**
   * Get token transfers for a wallet using The Graph API
   */
  async getTokenTransfers(walletAddress: string, chainId?: number, tokenAddress?: string, limit: number = 50) {
    if (!this.graphService) {
      throw new Error('Graph API service not initialized. Provide graphApiKey in constructor.');
    }
    
    return await this.graphService.getTokenTransfers(walletAddress, chainId, tokenAddress, limit);
  }

  /**
   * Check if Graph API service is available
   */
  isGraphAPIAvailable(): boolean {
    return this.graphService !== null;
  }

  /**
   * Get supported chains for Graph API
   */
  getSupportedChains() {
    if (!this.graphService) {
      throw new Error('Graph API service not initialized. Provide graphApiKey in constructor.');
    }
    
    return this.graphService.getSupportedChains();
  }

  /**
   * Enhanced bot creation with wallet balance validation (if Graph API is available)
   */
  async createBotWithBalanceCheck(request: BotCreationRequest): Promise<TradingBot> {
    // If Graph API is available and user provided wallet address, check balances
    if (this.graphService && request.swapConfig.senderAddress) {
      try {
        console.log(`💰 Checking wallet balances for ${request.swapConfig.senderAddress}...`);
        const balances = await this.getWalletBalances(request.swapConfig.senderAddress);
        
        // Log portfolio summary
        const totalValue = balances.reduce((sum, balance) => sum + (balance.valueUSD || 0), 0);
        console.log(`📊 Portfolio value: $${totalValue.toFixed(2)} across ${balances.length} tokens`);
        
        // Check if user has sufficient balance for the swap
        const originToken = balances.find(b => 
          b.token.symbol.toLowerCase() === request.swapConfig.originSymbol.toLowerCase()
        );
        
        if (originToken) {
          const requestedAmount = parseFloat(request.swapConfig.amount);
          const availableAmount = parseFloat(originToken.formattedAmount);
          
          if (requestedAmount > availableAmount) {
            console.warn(`⚠️  Insufficient balance: Requested ${requestedAmount} ${request.swapConfig.originSymbol}, available ${availableAmount}`);
          } else {
            console.log(`✅ Sufficient balance: ${availableAmount} ${request.swapConfig.originSymbol} available`);
          }
        }
        
      } catch (error) {
        console.warn(`⚠️  Could not check wallet balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Create bot normally
    return await this.createBot(request);
  }
}