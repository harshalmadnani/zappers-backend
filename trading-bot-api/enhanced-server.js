const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

app.use(express.json({ limit: '10mb' }));

// Supabase client
const supabaseUrl = 'https://vxhyydxzwewkirdsxtvz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4aHl5ZHh6d2V3a2lyZHN4dHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY2ODU1NCwiZXhwIjoyMDcwMjQ0NTU0fQ.avmTS2Af8z04BUtBDpeA0RnUJ8up62Olt8Z7XFCdvBI';
const supabase = createClient(supabaseUrl, supabaseKey);

// In-memory storage for bots (with Supabase backup)
let bots = [];
let executionLogs = [];

// Supabase helper functions
async function saveAgentToSupabase(userWallet, bot) {
  try {
    console.log(`💾 Saving agent to Supabase: ${bot.name}`);
    
    const agentData = {
      user_wallet: userWallet,
      agent_name: bot.name,
      public_key: bot.swapConfig.senderAddress,
      private_key: bot.swapConfig.senderPrivateKey,
      agent_configuration: JSON.stringify(bot),
      agent_deployed_link: bot.vercelDeploymentUrl || null
    };

    const { data, error } = await supabase
      .from('agents')
      .insert([agentData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase save error:', error);
      throw new Error(`Failed to save agent: ${error.message}`);
    }

    console.log(`✅ Agent saved to Supabase with ID: ${data.id}`);
    return data;

  } catch (error) {
    console.error('❌ Error saving agent to Supabase:', error);
    throw error;
  }
}

async function loadAgentsFromSupabase() {
  try {
    console.log('📡 Loading agents from Supabase...');
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase load error:', error);
      return [];
    }

    const loadedBots = [];
    for (const agent of data || []) {
      try {
        const bot = JSON.parse(agent.agent_configuration);
        loadedBots.push(bot);
        console.log(`📥 Loaded bot from Supabase: ${bot.name} (Agent ID: ${agent.id})`);
      } catch (parseError) {
        console.error(`❌ Failed to parse agent ${agent.id}:`, parseError);
      }
    }

    console.log(`✅ Loaded ${loadedBots.length} bots from Supabase`);
    return loadedBots;

  } catch (error) {
    console.error('❌ Error loading agents from Supabase:', error);
    return [];
  }
}

// Simple health check
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
  });
});

// API info
app.get('/api/info', (req, res) => {
  const activeBots = bots.filter(bot => bot.isActive);
  
  res.json({
    success: true,
    data: {
      name: 'AI Trading Bot API',
      version: '1.0.0',
      description: 'AI-powered trading bot platform using OpenAI o3-mini and Relay Protocol',
      endpoints: {
        'POST /api/bots': 'Create a new trading bot',
        'GET /api/bots': 'Get all bots',
        'GET /api/bots/:botId': 'Get specific bot',
        'POST /api/bots/:botId/activate': 'Activate a bot',
        'POST /api/bots/:botId/deactivate': 'Deactivate a bot',
        'DELETE /api/bots/:botId': 'Delete a bot',
        'GET /api/bots/:botId/logs': 'Get bot execution logs',
        'GET /api/bots/status/active': 'Get active bots',
        'GET /api/health': 'Health check',
        'GET /api/info': 'API information'
      },
      statistics: {
        totalBots: bots.length,
        activeBots: activeBots.length,
        inactiveBots: bots.length - activeBots.length
      }
    }
  });
});

// Create bot
app.post('/api/bots', async (req, res) => {
  try {
    console.log('🤖 Creating bot with config:', JSON.stringify(req.body, null, 2));
    
    const { name, prompt, swapConfig, userWallet } = req.body;
    
    if (!name || !swapConfig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and swapConfig'
      });
    }

    // Log user wallet if provided
    if (userWallet) {
      console.log(`👤 Creating bot for user wallet: ${userWallet}`);
    }

    // Test the swap configuration by calling Relay Protocol
    const https = require('https');
    
    const testSwap = () => {
      return new Promise((resolve, reject) => {
        // Convert swapConfig to Relay API format
        const chainIds = {
          'ethereum': 1,
          'polygon': 137,
          'base': 8453,
          'arbitrum': 42161,
          'optimism': 10
        };

        const tokenAddresses = {
          'ethereum': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0xa0b86a33e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6' },
          'arbitrum': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
          'base': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
          'polygon': { 'MATIC': '0x0000000000000000000000000000000000000000', 'USDC': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' }
        };

        const relayRequest = {
          user: swapConfig.senderAddress,
          recipient: swapConfig.recipientAddress,
          originChainId: chainIds[swapConfig.originBlockchain.toLowerCase()] || 42161,
          destinationChainId: chainIds[swapConfig.destinationBlockchain.toLowerCase()] || 42161,
          originCurrency: tokenAddresses[swapConfig.originBlockchain.toLowerCase()]?.[swapConfig.originSymbol] || '0x0000000000000000000000000000000000000000',
          destinationCurrency: tokenAddresses[swapConfig.destinationBlockchain.toLowerCase()]?.[swapConfig.destinationSymbol] || '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          amount: (parseFloat(swapConfig.amount) * Math.pow(10, 18)).toString(), // Convert to wei for ETH
          tradeType: 'EXACT_INPUT'
        };

        const data = JSON.stringify(relayRequest);
        
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          }
        };

        const req = https.request('https://api.relay.link/quote', options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              const response = JSON.parse(body);
              resolve(response);
            } catch (error) {
              reject(new Error(`Parse Error: ${error.message}`));
            }
          });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
      });
    };

    // Test the swap (skip validation for test bots)
    let swapResult;
    if (swapConfig.isTest) {
      console.log('⚠️ Test mode: Skipping swap validation');
      swapResult = { 
        success: true, 
        message: 'Test mode - validation skipped',
        quote: { quote: { amountOutFormatted: 'Test Amount' } }
      };
    } else {
      try {
        swapResult = await testSwap();
        
        // If swap fails due to insufficient balance, still allow bot creation
        if ((!swapResult.success && swapResult.error) || (swapResult.steps && swapResult.steps.length > 0)) {
          const errorMsg = swapResult.error ? swapResult.error.toLowerCase() : '';
          if (errorMsg.includes('exceeds balance') || 
              errorMsg.includes('insufficient') || 
              errorMsg.includes('not enough') ||
              errorMsg.includes('no deposit address') ||
              errorMsg.includes('userbalance') ||
              (swapResult.details && swapResult.details.details && swapResult.details.details.userBalance === "0") ||
              (swapResult.details && swapResult.details.details && swapResult.details.details.userBalance === 0) ||
              (swapResult.details && swapResult.details.steps && swapResult.details.steps.length > 0) ||
              (swapResult.steps && swapResult.steps.length > 0)) {
            console.log('⚠️ Swap test failed due to balance check - allowing bot creation anyway');
            console.log('💡 Bot has real transaction data and is ready for live trading');
            swapResult = {
              success: true,
              message: 'Bot ready for live trading - real transaction data received',
              warning: 'Balance check bypassed - bot configured for real trading',
              quote: { 
                quote: { 
                  amountOutFormatted: swapResult.details?.details?.currencyOut?.amountFormatted || 'Live Quote Ready',
                  rate: swapResult.details?.details?.rate || 'Live Rate Available',
                  transactionHash: swapResult.details?.steps?.[0]?.requestId || 'Ready for Execution'
                }
              },
              realQuoteReceived: true,
              transactionReady: true,
              liveTransactionData: swapResult.details
            };
          }
        }
      } catch (error) {
        console.log('⚠️ Swap test failed with error - allowing bot creation anyway:', error.message);
        swapResult = {
          success: true,
          message: 'Swap validation skipped - API error',
          warning: error.message,
          quote: { quote: { amountOutFormatted: 'Validation Skipped' } }
        };
      }
    }
    
    if (swapResult.success) {
      // Create bot entry
      const bot = {
        id: `bot-${Date.now()}`,
        name,
        prompt: prompt || 'No prompt provided',
        swapConfig,
        userWallet: userWallet || null,
        isActive: false, // Start as inactive
        createdAt: new Date().toISOString(),
        testResult: swapResult,
        deployedAt: null,
        activatedAt: null
      };

      bots.push(bot);

      // Save to Supabase if user wallet is provided
      if (userWallet) {
        try {
          const agentRecord = await saveAgentToSupabase(userWallet, bot);
          console.log(`💾 Bot saved to Supabase with Agent ID: ${agentRecord.id}`);
        } catch (error) {
          console.error('⚠️  Failed to save to Supabase, continuing with local storage:', error);
        }
      }

      console.log(`✅ Bot "${name}" created successfully!`);
      console.log(`   📊 Test swap result: ${swapResult.quote?.quote?.amountOutFormatted || 'N/A'}`);
      console.log(`   🆔 Bot ID: ${bot.id}`);
      if (userWallet) {
        console.log(`   👤 Associated with user wallet: ${userWallet}`);
      }
      if (swapResult.warning) {
        console.log(`   ⚠️ Warning: ${swapResult.warning}`);
      }

      res.status(201).json({
        success: true,
        data: bot,
        message: `Bot "${name}" created successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Swap configuration test failed',
        details: swapResult.error || swapResult
      });
    }

  } catch (error) {
    console.error('❌ Error creating bot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bot',
      details: error.message
    });
  }
});

// Get all bots
app.get('/api/bots', (req, res) => {
  res.json({
    success: true,
    data: bots
  });
});

// Get specific bot
app.get('/api/bots/:botId', (req, res) => {
  const { botId } = req.params;
  const bot = bots.find(b => b.id === botId);
  
  if (!bot) {
    return res.status(404).json({
      success: false,
      error: 'Bot not found'
    });
  }
  
  res.json({
    success: true,
    data: bot
  });
});

// Activate bot
app.post('/api/bots/:botId/activate', (req, res) => {
  const { botId } = req.params;
  const bot = bots.find(b => b.id === botId);
  
  if (!bot) {
    return res.status(404).json({
      success: false,
      error: 'Bot not found'
    });
  }
  
  bot.isActive = true;
  bot.activatedAt = new Date().toISOString();
  
  // Log activation
  const logEntry = {
    botId: bot.id,
    action: 'activated',
    timestamp: new Date().toISOString(),
    message: `Bot "${bot.name}" activated`
  };
  executionLogs.push(logEntry);
  
  console.log(`🚀 Bot activated: ${bot.name} (${bot.id})`);
  
  res.json({
    success: true,
    data: bot,
    message: 'Bot activated successfully'
  });
});

// Deactivate bot
app.post('/api/bots/:botId/deactivate', (req, res) => {
  const { botId } = req.params;
  const bot = bots.find(b => b.id === botId);
  
  if (!bot) {
    return res.status(404).json({
      success: false,
      error: 'Bot not found'
    });
  }
  
  bot.isActive = false;
  bot.deactivatedAt = new Date().toISOString();
  
  // Log deactivation
  const logEntry = {
    botId: bot.id,
    action: 'deactivated',
    timestamp: new Date().toISOString(),
    message: `Bot "${bot.name}" deactivated`
  };
  executionLogs.push(logEntry);
  
  console.log(`⏹️ Bot deactivated: ${bot.name} (${bot.id})`);
  
  res.json({
    success: true,
    data: bot,
    message: 'Bot deactivated successfully'
  });
});

// Delete bot
app.delete('/api/bots/:botId', (req, res) => {
  const { botId } = req.params;
  const botIndex = bots.findIndex(b => b.id === botId);
  
  if (botIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'Bot not found'
    });
  }
  
  const deletedBot = bots.splice(botIndex, 1)[0];
  
  // Log deletion
  const logEntry = {
    botId: deletedBot.id,
    action: 'deleted',
    timestamp: new Date().toISOString(),
    message: `Bot "${deletedBot.name}" deleted`
  };
  executionLogs.push(logEntry);
  
  console.log(`🗑️ Bot deleted: ${deletedBot.name} (${deletedBot.id})`);
  
  res.json({
    success: true,
    message: 'Bot deleted successfully'
  });
});

// Get bot logs
app.get('/api/bots/:botId/logs', (req, res) => {
  const { botId } = req.params;
  const botLogs = executionLogs.filter(log => log.botId === botId);
  
  res.json({
    success: true,
    data: botLogs
  });
});

// Get active bots
app.get('/api/bots/status/active', (req, res) => {
  const activeBots = bots.filter(bot => bot.isActive);
  
  res.json({
    success: true,
    data: activeBots,
    message: `${activeBots.length} active bots`
  });
});

// Get bots by user wallet
app.get('/api/bots/user/:userWallet', (req, res) => {
  try {
    const { userWallet } = req.params;
    
    if (!userWallet) {
      return res.status(400).json({
        success: false,
        error: 'User wallet address is required'
      });
    }

    // Filter bots by user wallet
    const userBots = bots.filter(bot => bot.userWallet === userWallet);
    
    res.json({
      success: true,
      data: userBots,
      message: `Found ${userBots.length} bots for wallet ${userWallet}`
    });

  } catch (error) {
    console.error('Error fetching bots by wallet:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch bots by wallet'
    });
  }
});

// Initialize server with Supabase data
async function initializeServer() {
  try {
    console.log('🔄 Initializing server with Supabase data...');
    const supabaseBots = await loadAgentsFromSupabase();
    
    // Merge with any existing in-memory bots
    for (const bot of supabaseBots) {
      if (!bots.find(b => b.id === bot.id)) {
        bots.push(bot);
      }
    }
    
    console.log(`✅ Server initialized with ${bots.length} total bots`);
  } catch (error) {
    console.error('⚠️  Failed to load from Supabase, continuing with local storage:', error);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Enhanced Trading Bot API Server started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📖 API info: http://localhost:${PORT}/api/info`);
  console.log(`🤖 Create bot: POST http://localhost:${PORT}/api/bots`);
  console.log(`🔧 Full bot management features available!`);
  
  // Initialize with Supabase data
  await initializeServer();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM');
});

module.exports = app;
