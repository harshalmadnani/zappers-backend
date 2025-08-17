import OpenAI from 'openai';
import { TradingStrategy, SwapRequest, BotCreationRequest } from '../types';

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateTradingBot(request: BotCreationRequest): Promise<{
    code: string;
    strategy: TradingStrategy;
    explanation: string;
  }> {
    const prompt = this.buildBotGenerationPrompt(request);

    try {
      const completion = await this.client.chat.completions.create({
        model: "o3-mini", // Using GPT-4 as o3-mini might not be available yet
        messages: [
          {
            role: "system",
            content: `You are an expert trading bot developer. Generate complete, production-ready TypeScript code for trading bots that:
1. Listen to Hyperliquid WebSocket for real-time price data
2. Execute cross-chain swaps using Relay API (https://api.relay.link)
3. Follow specific trading strategies based on user prompts
4. Include proper error handling and logging
5. Are deployable to Vercel as serverless functions

Use Hyperliquid WebSocket API (wss://api.hyperliquid.xyz/ws) with this subscription format:
{
  "method": "subscribe",
  "subscription": {
    "type": "trades",
    "coin": "SOL"
  }
}

For wallet balances and historical data, use The Graph Token API (https://token-api.thegraph.com) with JWT authentication:
- GET /balances/evm/{address} - Get token balances for a wallet
- GET /tokens/{chainId}/{tokenAddress}/prices - Get historical prices
- GET /tokens/{chainId}/{tokenAddress} - Get token metadata
- GET /transfers/{address} - Get token transfer history

Use the provided JWT token for The Graph API authentication.

Example Graph API usage:
\`\`\`typescript
const graphHeaders = {
  'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
  'Accept': 'application/json'
};

// Get wallet balances
const balancesResponse = await fetch(\`https://token-api.thegraph.com/balances/evm/$\{walletAddress\}\`, {
  headers: graphHeaders
});

// The response format includes:
// - data: array of token balances with contract, amount, value, name, symbol, decimals
// - pagination: for handling large result sets
// - statistics: query performance metrics
\`\`\`

For swaps, use Relay API endpoints:
- POST /quote - Get swap quote with proper chain IDs and token addresses
- Execute transactions using ethers.js with the returned transaction data
- GET /intents/status - Check cross-chain execution status

Chain ID mapping (use exact chain IDs):
- Ethereum: 1
- Optimism: 10  
- Cronos: 25
- BSC: 56
- Gnosis: 100
- Unichain: 130
- Polygon: 137
- Sonic: 146
- Manta Pacific: 169
- Mint: 185
- Boba: 288
- zkSync: 324
- Shape: 360
- Appchain: 466
- World Chain: 480
- Redstone: 690
- Flow EVM: 747
- HyperEVM: 999
- Metis: 1088
- Polygon zkEVM: 1101
- Lisk: 1135
- Sei: 1329
- Hyperliquid: 1337
- Perennial: 1424
- Story: 1514
- Gravity: 1625
- Soneium: 1868
- Swellchain: 1923
- Sanko: 1996
- Ronin: 2020
- Abstract: 2741
- Morph: 2818
- Hychain: 2911
- Mantle: 5000
- Superseed: 5330
- Cyber: 7560
- Powerloom V2: 7869
- Arena Z: 7897
- B3: 8333
- Base: 8453
- Onchain Points: 17071
- ApeChain: 33139
- Funki: 33979
- Mode: 34443
- Arbitrum: 42161
- Arbitrum Nova: 42170
- Celo: 42220
- Hemi: 43111
- Avalanche: 43114
- Gunz: 43419
- Zircuit: 48900
- Superposition: 55244
- Ink: 57073
- Linea: 59144
- Bob: 60808
- AnimeChain: 69000
- Apex: 70700
- Boss: 70701
- Berachain: 80094
- Blast: 81457
- Plume: 98866
- Taiko: 167000
- Scroll: 534352
- Zero Network: 543210
- Xai: 660279
- Katana: 747474
- Forma: 984122
- Zora: 7777777
- Bitcoin: 8253038
- Eclipse: 9286185
- Soon: 9286186
- Corn: 21000000
- Sui: 103665049
- Degen: 666666666
- Solana: 792703809
- Ancient8: 888888888
- Rari: 1380012617

Token addresses for common tokens (use native 0x000...000 for native tokens):

Ethereum (1):
- ETH: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
- WETH: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
- WBTC: 0x2260fac5e5542a773aa44fbcfedf7c193bc2c599

Arbitrum (42161):
- ETH: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0xaf88d065e77c8cc2239327c5edb3a432268e5831
- WETH: 0x82af49447d8a07e3bd95bd0d56f35241523fbab1
- WBTC: 0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f

Base (8453):
- ETH: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
- WETH: 0x4200000000000000000000000000000000000006

Polygon (137):
- POL: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0x3c499c542cef5e3811e1192ce70d8cc03d5c3359
- WPOL: 0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270

Katana (747474):
- ETH: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0x203a662b0bd271a6ed5a60edfbd04bfce608fd36
- WETH: 0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62
- RON: 0x32e17b01d0c73b2c9f0745b0b45b7a8b7f6b5e8f
- AXS: 0x97a9107c1793bc407d6f527b77e7fff4d812bece

Flow EVM (747):
- FLOW: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0xf1815bd50389c46847f0bda824ec8da914045d14
- WFLOW: 0xd3bf53dac106a0290b0483ecbc89d40fcc961f3e

Zircuit (48900):
- ETH: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
- WETH: 0x4200000000000000000000000000000000000006

BSC (56):
- BNB: 0x0000000000000000000000000000000000000000 (native)
- USDC: 0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d
- WBNB: 0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c

Quote request format:
{
  "user": "0x...",
  "recipient": "0x...", 
  "originChainId": 42161,
  "destinationChainId": 747474,
  "originCurrency": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  "destinationCurrency": "0x0000000000000000000000000000000000000000",
  "amount": "1000000", // Amount in smallest unit (6 decimals for USDC)
  "tradeType": "EXACT_INPUT"
}

Return your response as a JSON object with:
- code: Complete TypeScript code for a Vercel API route
- strategy: Trading strategy object with type and parameters
- explanation: Brief explanation of the bot's logic

The code should be a complete Vercel API route that can be deployed immediately.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response);
        return {
          code: parsed.code,
          strategy: parsed.strategy,
          explanation: parsed.explanation
        };
      } catch (parseError) {
        // If not JSON, extract code from markdown blocks
        const codeMatch = response.match(/```(?:typescript|ts)?\n([\s\S]*?)\n```/);
        const code = codeMatch ? codeMatch[1] : response;
        
        return {
          code,
          strategy: this.extractStrategyFromPrompt(request),
          explanation: 'Generated trading bot based on user requirements'
        };
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate trading bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildBotGenerationPrompt(request: BotCreationRequest): string {
    const { name, prompt, swapConfig, strategy } = request;

    return `Create a trading bot with the following requirements:

Bot Name: ${name}
User Prompt: ${prompt}

Swap Configuration:
- Origin: ${swapConfig.amount} ${swapConfig.originSymbol} on ${swapConfig.originBlockchain}
- Destination: ${swapConfig.destinationSymbol} on ${swapConfig.destinationBlockchain}
- Sender: ${swapConfig.senderAddress}
- Recipient: ${swapConfig.recipientAddress}

Target Coin for Hyperliquid WebSocket: ${request.targetCoin || 'SOL'}

Required Features:
1. Connect to Hyperliquid WebSocket at wss://api.hyperliquid.xyz/ws
2. Monitor real-time trade data for the target coin
3. Implement trading logic based on the user prompt
4. Execute cross-chain swaps via Relay API at https://api.relay.link
5. Include proper error handling and logging
6. Store execution history
7. Support price thresholds, intervals, and custom conditions
8. Use The Graph Token API for wallet balance checks and historical price analysis
9. Implement portfolio value tracking and token metadata fetching

The code should be a complete Vercel API route that:
- Exports a default handler function
- Handles GET requests for status and POST requests for manual execution
- Manages WebSocket connections efficiently
- Includes environment variable configuration
- Has proper TypeScript types
- Uses Relay API for cross-chain swaps with proper chain ID mapping
- Supports multiple blockchains (Ethereum, Polygon, Base, Arbitrum, Katana, Zircuit, Flow EVM, BSC, Avalanche, and 20+ other chains)
- Implements proper error handling and transaction confirmation
- Uses ethers.js v6 for wallet operations and transaction execution
- Handles token decimals correctly (USDC = 6, ETH = 18)
- Includes balance checking before executing swaps
- Implements retry logic for failed transactions
- Logs all activities with timestamps

Important implementation details:
- Use ethers.parseUnits() for converting amounts to wei/smallest units
- Handle chainId from quote response steps for transaction execution
- Wait for transaction confirmation before proceeding
- Check user balances before attempting swaps
- Use proper RPC endpoints for each chain
- Handle both ERC20 tokens and native tokens correctly
- For cross-chain operations, validate that the quote is actually cross-chain
- If cross-chain is not supported, provide clear error messages
- Handle fallback to same-chain operations when cross-chain fails

Cross-chain operation guidelines:
- Always validate that originChainId !== destinationChainId in the quote response
- If both currencies are on the same chain, it's not a true cross-chain swap
- Log clear messages about cross-chain vs same-chain operations
- Provide helpful error messages when cross-chain routes are unavailable

The Graph API integration guidelines:
- Use The Graph Token API ONLY if the user explicitly requests graph data 
- Check wallet balances before executing swaps to ensure sufficient funds
- Use historical price data to improve trading strategy decisions
- Fetch token metadata to validate token addresses and get proper decimals
- Implement portfolio tracking for multi-token strategies
- Use rate limiting (100ms between requests) to avoid API limits
- Handle API errors gracefully with fallback mechanisms
- Cache frequently accessed data to reduce API calls

Make the bot intelligent and responsive to the user's trading strategy described in their prompt.`;
  }

  private extractStrategyFromPrompt(request: BotCreationRequest): TradingStrategy {
    const { prompt, strategy } = request;
    
    // Simple strategy extraction based on keywords
    let type: TradingStrategy['type'] = 'custom';
    const parameters: TradingStrategy['parameters'] = {};

    if (prompt.toLowerCase().includes('price above') || prompt.toLowerCase().includes('price below')) {
      type = 'price_threshold';
      const priceMatch = prompt.match(/(\d+(?:\.\d+)?)/);
      if (priceMatch) {
        if (prompt.toLowerCase().includes('above')) {
          parameters.buyThreshold = parseFloat(priceMatch[1]);
        } else {
          parameters.sellThreshold = parseFloat(priceMatch[1]);
        }
      }
    } else if (prompt.toLowerCase().includes('between') || prompt.toLowerCase().includes('range')) {
      type = 'price_range';
      const priceMatches = prompt.match(/(\d+(?:\.\d+)?)/g);
      if (priceMatches && priceMatches.length >= 2) {
        parameters.minPrice = parseFloat(priceMatches[0]);
        parameters.maxPrice = parseFloat(priceMatches[1]);
      }
    } else if (prompt.toLowerCase().includes('every') || prompt.toLowerCase().includes('interval')) {
      type = 'interval';
      const intervalMatch = prompt.match(/(\d+)\s*(minute|hour|second)/i);
      if (intervalMatch) {
        const value = parseInt(intervalMatch[1]);
        const unit = intervalMatch[2].toLowerCase();
        let milliseconds = value;
        if (unit === 'minute') milliseconds *= 60 * 1000;
        else if (unit === 'hour') milliseconds *= 60 * 60 * 1000;
        else if (unit === 'second') milliseconds *= 1000;
        parameters.interval = milliseconds;
      }
    }

    return {
      id: `strategy-${Date.now()}`,
      name: `Strategy for ${request.name}`,
      description: prompt,
      type,
      parameters: { ...parameters, ...strategy?.parameters }
    };
  }

  async generateManualSwapCode(swapRequest: {
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
    const prompt = `Generate a complete manual swap script for cross-chain token swap:

From: ${swapRequest.fromAmount} ${swapRequest.fromToken} on ${swapRequest.fromChain} (Chain ID: ${swapRequest.fromChainId})
To: ${swapRequest.toToken} on ${swapRequest.toChain} (Chain ID: ${swapRequest.toChainId})
Wallet: ${swapRequest.senderAddress}

Requirements:
1. Use Relay API (https://api.relay.link) for cross-chain swaps
2. Use ethers.js v6 for blockchain interactions
3. Include proper error handling and logging
4. Check balances before executing
5. Wait for transaction confirmations
6. Handle both ERC20 and native tokens
7. Use proper token decimals and amounts
8. Include retry logic for failed transactions

The script should be a complete Node.js script that can be run directly.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "o3-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert blockchain developer. Generate complete, production-ready JavaScript/TypeScript code for cross-chain token swaps using modern tools and best practices."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI for manual swap generation');
      }

      // Extract code from markdown if present
      const codeMatch = response.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)\n```/);
      return codeMatch ? codeMatch[1] : response;

    } catch (error) {
      console.error('Manual swap generation error:', error);
      throw new Error(`Failed to generate manual swap code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async optimizeStrategy(
    currentStrategy: TradingStrategy,
    executionHistory: any[],
    marketData: any[]
  ): Promise<TradingStrategy> {
    const prompt = `Analyze the trading performance and optimize the strategy:

Current Strategy: ${JSON.stringify(currentStrategy, null, 2)}
Execution History: ${JSON.stringify(executionHistory.slice(-10), null, 2)}
Recent Market Data: ${JSON.stringify(marketData.slice(-20), null, 2)}

Provide an optimized strategy that improves performance based on the historical data and market patterns.
Return as JSON with the same structure as the current strategy.`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "o3-mini",
        messages: [
          {
            role: "system",
            content: "You are a quantitative trading analyst. Analyze trading performance and optimize strategies based on historical data and market patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI for strategy optimization');
      }

      try {
        return JSON.parse(response);
      } catch {
        // If parsing fails, return current strategy
        return currentStrategy;
      }
    } catch (error) {
      console.error('Strategy optimization error:', error);
      return currentStrategy;
    }
  }
}
