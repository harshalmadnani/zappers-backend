import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BotManager } from './services/bot-manager';
import { createBotsRouter } from './routes/bots';
import { APIResponse } from './types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Environment variables validation
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'VERCEL_TOKEN'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

// Initialize services
const botManager = new BotManager(
  process.env.OPENAI_API_KEY!,
  process.env.VERCEL_TOKEN!,
  process.env.RELAY_API_KEY, // Optional Relay API key
  'SOL', // Default coin, but each bot can specify its own
  process.env.IS_TESTNET === 'true'
);

// Event listeners for bot manager
botManager.on('botCreated', (bot) => {
  console.log(`🎉 Bot created: ${bot.name} (${bot.id})`);
});

botManager.on('botActivated', (bot) => {
  console.log(`🚀 Bot activated: ${bot.name}`);
});

botManager.on('botDeactivated', (bot) => {
  console.log(`⏹️ Bot deactivated: ${bot.name}`);
});

botManager.on('tradeExecuted', ({ bot, action, price, result }) => {
  console.log(`💱 Trade executed by ${bot.name}: ${action} at $${price} - ${result.success ? 'SUCCESS' : 'FAILED'}`);
});

// Routes
app.use('/api/bots', createBotsRouter(botManager));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    },
    message: 'Trading Bot API is running'
  } as APIResponse);
});

// API info
app.get('/api/info', (req, res) => {
  const activeBots = botManager.getActiveBots();
  const allBots = botManager.getAllBots();
  
  res.json({
    success: true,
    data: {
      name: 'AI Trading Bot API',
      version: '1.0.0',
              description: 'AI-powered trading bot platform using OpenAI o3-mini and Relay API',
      endpoints: {
        'POST /api/bots': 'Create a new trading bot',
        'GET /api/bots': 'Get all bots',
        'GET /api/bots/:botId': 'Get specific bot',
        'POST /api/bots/:botId/activate': 'Activate a bot',
        'POST /api/bots/:botId/deactivate': 'Deactivate a bot',
        'DELETE /api/bots/:botId': 'Delete a bot',
        'GET /api/bots/:botId/logs': 'Get bot execution logs',
        'POST /api/bots/:botId/optimize': 'Optimize bot strategy',
        'GET /api/bots/status/active': 'Get active bots',
        'GET /api/bots/market/price-history': 'Get price history',
        'GET /api/health': 'Health check',
        'GET /api/info': 'API information'
      },
      statistics: {
        totalBots: allBots.length,
        activeBots: activeBots.length,
        inactiveBots: allBots.length - activeBots.length
      },
      integrations: {
        openai: 'o3-mini model for bot generation',
        hyperliquid: 'WebSocket for real-time price data',
        relay: 'Cross-chain swap execution via Relay Protocol',
        vercel: 'Serverless bot deployment'
      }
    }
  } as APIResponse);
});

// Example bot creation endpoint for testing
app.post('/api/example-bot', async (req, res) => {
  try {
    const exampleBot = {
      name: 'Example DCA Bot',
      prompt: 'Create a dollar-cost averaging bot that buys USDC with ETH every 30 minutes when the price is below $3000',
      swapConfig: {
        senderAddress: '0x0000000000000000000000000000000000000000',
        senderPrivateKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
        recipientAddress: '0x0000000000000000000000000000000000000000',
        originSymbol: 'ETH',
        originBlockchain: 'ETH',
        destinationSymbol: 'USDC',
        destinationBlockchain: 'ETH',
        amount: '0.01',
        isTest: true
      }
    };

    res.json({
      success: true,
      data: exampleBot,
      message: 'Example bot configuration - replace with real addresses and set isTest to false'
    } as APIResponse);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create example bot'
    } as APIResponse);
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: 'Visit /api/info for available endpoints'
  } as APIResponse);
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  } as APIResponse);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Trading Bot API Server started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api/info`);
  console.log(`🤖 Create bot: POST http://localhost:${PORT}/api/bots`);
  console.log(`🌐 Network: ${process.env.IS_TESTNET === 'true' ? 'testnet' : 'mainnet'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  // Deactivate all bots
  const activeBots = botManager.getActiveBots();
  Promise.all(activeBots.map(bot => botManager.deactivateBot(bot.id)))
    .then(() => {
      console.log('✅ All bots deactivated');
      server.close(() => {
        console.log('🔌 Server closed');
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM');
});

export default app;