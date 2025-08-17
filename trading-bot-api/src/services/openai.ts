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

For swaps, use Relay API endpoints:
- POST /quote - Get swap quote
- POST /execute - Execute gasless transaction
- GET /intents/status - Check execution status

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

The code should be a complete Vercel API route that:
- Exports a default handler function
- Handles GET requests for status and POST requests for manual execution
- Manages WebSocket connections efficiently
- Includes environment variable configuration
- Has proper TypeScript types
- Uses Relay API for cross-chain swaps with proper chain ID mapping
- Supports multiple blockchains (Ethereum, Polygon, Base, Arbitrum, etc.)

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
