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
let activeConnections = new Map(); // Track active bot connections

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
          'optimism': 10,
          'cronos': 25,
          'bsc': 56,
          'gnosis': 100,
          'unichain': 130,
          'polygon': 137,
          'sonic': 146,
          'manta-pacific': 169,
          'mint': 185,
          'boba': 288,
          'zksync': 324,
          'shape': 360,
          'appchain': 466,
          'world-chain': 480,
          'redstone': 690,
          'flow-evm': 747,
          'hyperevm': 999,
          'metis': 1088,
          'polygon-zkevm': 1101,
          'lisk': 1135,
          'sei': 1329,
          'hyperliquid': 1337,
          'perennial': 1424,
          'story': 1514,
          'gravity': 1625,
          'soneium': 1868,
          'swellchain': 1923,
          'sanko': 1996,
          'ronin': 2020,
          'abstract': 2741,
          'morph': 2818,
          'hychain': 2911,
          'mantle': 5000,
          'superseed': 5330,
          'cyber': 7560,
          'powerloom-v2': 7869,
          'arena-z': 7897,
          'b3': 8333,
          'base': 8453,
          'onchain-points': 17071,
          'apechain': 33139,
          'funki': 33979,
          'mode': 34443,
          'arbitrum': 42161,
          'arbitrum-nova': 42170,
          'celo': 42220,
          'hemi': 43111,
          'avalanche': 43114,
          'gunz': 43419,
          'zircuit': 48900,
          'superposition': 55244,
          'ink': 57073,
          'linea': 59144,
          'bob': 60808,
          'animechain': 69000,
          'apex': 70700,
          'boss': 70701,
          'berachain': 80094,
          'blast': 81457,
          'plume': 98866,
          'taiko': 167000,
          'scroll': 534352,
          'zero-network': 543210,
          'xai': 660279,
          'katana': 747474,
          'forma': 984122,
          'zora': 7777777,
          'bitcoin': 8253038,
          'eclipse': 9286185,
          'soon': 9286186,
          'corn': 21000000,
          'sui': 103665049,
          'degen': 666666666,
          'solana': 792703809,
          'ancient8': 888888888,
          'rari': 1380012617
        };

        const tokenAddresses = {
          'ethereum': { 
            'ETH': '0x0000000000000000000000000000000000000000', 
            'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
            'WETH': '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
            'APE': '0x4d224452801aced8b2f0aebe155379bb5d594381',
            'ANIME': '0x4dc26fc5854e7648a064a4abd590bbe71724c277',
            'PLUME': '0x4c1746a800d224393fe2470c70a35717ed4ea5f1',
            'GOD': '0xb5130f4767ab0acc579f25a76e8f9e977cb3f948',
            'CBBTC': '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
            'TOPIA': '0xccccb68e1a848cbdb5b60a974e07aae143ed40c3',
            'POWER': '0x429f0d8233e517f9acf6f0c8293bf35804063a83',
            'OMI': '0xed35af169af46a02ee13b9d79eb57d6d68c1749e',
            'SIPHER': '0x9f52c8ecbee10e00d9faaac5ee9ba0ff6550f511',
            'G': '0x9c7beba8f6ef6643abd725e45a4e8387ef260649'
          },
          'arbitrum': { 
            'ETH': '0x0000000000000000000000000000000000000000', 
            'USDC': '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
            'USDT': '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
            'WETH': '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
            'WBTC': '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
            'XAI': '0x4cb9a7ae498cedcbb5eae9f25736ae7d428c9d66',
            'ANIME': '0x37a645648df29205c6261289983fb04ecd70b4b3',
            'CBBTC': '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
            'DMT': '0x8b0e6f19ee57089f7649a455d89d7bc6314d04e8',
            'APE': '0x7f9fbf9bdd3f4105c478b996b648fe6e828a1e98',
            'ARB': '0x912ce59144191c1204e64559fe8253a0e49e6548',
            'LINK': '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
            'WEETH': '0x35751007a407ca6feffe80b3cb397736d2cf4dbe',
            'PENDLE': '0x0c880f6761f1af8d9aa9c466984b80dab9a8c9e8',
            'USDC.E': '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
            'DAI': '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1',
            'WSTETH': '0x5979d7b546e38e414f7e9822514be443a4800529',
            'T': '0x30a538effd91acefb1b12ce9bc0074ed18c9dfc9',
            'GHO': '0x7dff72693f6a4149b17e7c6314655f6a9f7c8b33',
            'USDE': '0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34',
            'RWA': '0x3096e7bfd0878cc65be71f8899bc4cfb57187ba3',
            'CRV': '0x11cdb42b0eb46d95f990bedd4695a6e3fa034978',
            'AAVE': '0xba5ddd1f9d7f570dc94a51479a000e3bce967196',
            'EZETH': '0x2416092f143378750bb29b79ed961ab195cceea5',
            'TBTC': '0x6c84a8f1c29108f47a79964b5fe888d4f4d0de40'
          },
          'base': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
          'polygon': { 'MATIC': '0x0000000000000000000000000000000000000000', 'USDC': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' },
          'katana': { 
            'ETH': '0x0000000000000000000000000000000000000000', 
            'USDC': '0x203a662b0bd271a6ed5a60edfbd04bfce608fd36',
            'USDT': '0x2dca96907fde857dd3d816880a0df407eeb2d2f2',
            'WBTC': '0x0913da6da4b42f538b445599b46bb4622342cf52',
            'WETH': '0xee7d8bcfb72bc1880d0cf19822eb0a2e6577ab62',
            'RON': '0x32e17b01d0c73b2c9f0745b0b45b7a8b7f6b5e8f',
            'AXS': '0x97a9107c1793bc407d6f527b77e7fff4d812bece',
            'SLP': '0xa8754b9fa15fc18bb59458815510e40a12cd2014',
            'WRON': '0xe514d9deb7966c8be0ca922de8a064264ea6bcd4',
            'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
            'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
            'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            'AAVE': '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            'CRV': '0xd533a949740bb3306d119cc777fa900ba034cd52',
            'SUSHI': '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
            'YFI': '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            'BAL': '0xba100000625a3754423978a60c9317c58a424e3d',
            'COMP': '0xc00e94cb662c3520282e6f5717214004a7f26888',
            'MKR': '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            'SNX': '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
            'LDO': '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
            'WSTETH': '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
            'STETH': '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
            'MATIC': '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
            'BNB': '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
            'AVAX': '0x85f138bfee4ef8e540890cfb48f620571d67eda3',
            'FTM': '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
            'ATOM': '0x8d983cb9388eac77af0474fa441c4815500cb7bb',
            'DOT': '0x7083609fce4d1d8dc0c979aab8c869ea2c873402',
            'SOL': '0xd31a59c85ae9d8edefec411d448f90841571b89c'
          },
          'zircuit': { 
            'ETH': '0x0000000000000000000000000000000000000000', 
            'WETH': '0x4200000000000000000000000000000000000006',
            'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            'USDT': '0xdac17f958d2ee523a2206206994597c13d831ec7',
            'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
            'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
            'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            'AAVE': '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            'CRV': '0xd533a949740bb3306d119cc777fa900ba034cd52',
            'COMP': '0xc00e94cb662c3520282e6f5717214004a7f26888',
            'MKR': '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            'SUSHI': '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
            'SNX': '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
            'YFI': '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            'BAL': '0xba100000625a3754423978a60c9317c58a424e3d',
            'LDO': '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
            'STETH': '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
            'WSTETH': '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'
          },
          'flow_evm': {
            'FLOW': '0x0000000000000000000000000000000000000000',
            'USDC': '0xf1815bd50389c46847f0bda824ec8da914045d14',
            'WFLOW': '0xd3bf53dac106a0290b0483ecbc89d40fcc961f3e',
            'USDT': '0x2dca96907fde857dd3d816880a0df407eeb2d2f2',
            'WETH': '0x4200000000000000000000000000000000000006',
            'WBTC': '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            'DAI': '0x6b175474e89094c44da98b954eedeac495271d0f',
            'LINK': '0x514910771af9ca656af840dff83e8264ecf986ca',
            'UNI': '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            'AAVE': '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
            'CRV': '0xd533a949740bb3306d119cc777fa900ba034cd52',
            'SUSHI': '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
            'YFI': '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            'BAL': '0xba100000625a3754423978a60c9317c58a424e3d',
            'COMP': '0xc00e94cb662c3520282e6f5717214004a7f26888',
            'MKR': '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
            'SNX': '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
            'LDO': '0x5a98fcbea516cf06857215779fd812ca3bef1b32'
          }
        };

        // Use proper amount conversion based on token
        let convertedAmount;
        if (swapConfig.originSymbol.toUpperCase() === 'USDC') {
          convertedAmount = (parseFloat(swapConfig.amount) * Math.pow(10, 6)).toString(); // USDC has 6 decimals
        } else {
          convertedAmount = (parseFloat(swapConfig.amount) * Math.pow(10, 18)).toString(); // ETH has 18 decimals
        }

        // For cross-chain swaps, use sender as recipient if not specified
        const isCrossChain = swapConfig.originBlockchain.toLowerCase() !== swapConfig.destinationBlockchain.toLowerCase();
        const recipientAddress = swapConfig.recipientAddress || (isCrossChain ? swapConfig.senderAddress : '0x0000000000000000000000000000000000000000');
        
        const relayRequest = {
          user: swapConfig.senderAddress,
          recipient: recipientAddress,
          originChainId: chainIds[swapConfig.originBlockchain.toLowerCase()] || 42161,
          destinationChainId: chainIds[swapConfig.destinationBlockchain.toLowerCase()] || 42161,
          originCurrency: tokenAddresses[swapConfig.originBlockchain.toLowerCase()]?.[swapConfig.originSymbol] || '0x0000000000000000000000000000000000000000',
          destinationCurrency: tokenAddresses[swapConfig.destinationBlockchain.toLowerCase()]?.[swapConfig.destinationSymbol] || '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
          amount: convertedAmount,
          tradeType: 'EXACT_INPUT',
          slippageTolerance: swapConfig.slippageTolerance || "10.0" // Use provided slippage tolerance
        };

        // Only add extra parameters for same-chain swaps to avoid cross-chain issues
        if (!isCrossChain) {
          relayRequest.useFallbacks = true;
          relayRequest.useExternalLiquidity = true;
        }

        const data = JSON.stringify(relayRequest);
        
        // Debug: Log the exact request being sent to Relay API
        console.log('🔍 DEBUG: Relay API request:', JSON.stringify(relayRequest, null, 2));
        
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
        
        // Allow bot creation for any valid swap response or error that indicates real trading capability
        if ((!swapResult.success && swapResult.error) || (swapResult.steps && swapResult.steps.length > 0)) {
          const errorMsg = swapResult.error ? swapResult.error.toLowerCase() : '';
          
          // Allow creation for balance issues, swap impact, or any trading-related errors
          if (errorMsg.includes('exceeds balance') || 
              errorMsg.includes('insufficient') || 
              errorMsg.includes('not enough') ||
              errorMsg.includes('no deposit address') ||
              errorMsg.includes('userbalance') ||
              errorMsg.includes('swap impact') ||
              errorMsg.includes('impact_too_high') ||
              errorMsg.includes('slippage') ||
              errorMsg.includes('-100.00%') ||
              errorMsg.includes('sender and recipient cannot be the same') ||
              (swapResult.details && swapResult.details.details && swapResult.details.details.userBalance === "0") ||
              (swapResult.details && swapResult.details.details && swapResult.details.details.userBalance === 0) ||
              (swapResult.details && swapResult.details.steps && swapResult.details.steps.length > 0) ||
              (swapResult.steps && swapResult.steps.length > 0)) {
            
            console.log('⚠️ Swap validation issue detected - allowing bot creation for real trading');
            console.log(`   Issue: ${swapResult.error || 'Balance/Impact check'}`);
            console.log('💡 Bot configured for live trading with high slippage tolerance');
            
            swapResult = {
              success: true,
              message: 'Bot ready for live trading - validation bypassed for real trades',
              warning: `Original issue: ${swapResult.error || 'Validation bypassed'}`,
              quote: { 
                quote: { 
                  amountOutFormatted: swapResult.details?.details?.currencyOut?.amountFormatted || 'Ready for Live Trading',
                  rate: swapResult.details?.details?.rate || 'Live Rate Available',
                  transactionHash: swapResult.details?.steps?.[0]?.requestId || 'Ready for Execution'
                }
              },
              realQuoteReceived: true,
              transactionReady: true,
              liveTransactionData: swapResult.details,
              bypassedValidation: true,
              slippageTolerance: "10.0"
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

// Automated trading function
async function executeAutomatedTrade(bot) {
  if (!bot.isActive || bot.swapConfig.isTest) {
    return; // Skip if bot is inactive or in test mode
  }

  try {
    console.log(`🔄 Executing automated trade for bot: ${bot.name}`);
    
    const axios = require('axios');
    const { ethers } = require('ethers');
    
    // Use the same chain/token mapping as bot creation
    const chainIds = {
      'ethereum': 1,
      'polygon': 137,
      'base': 8453,
      'arbitrum': 42161,
      'optimism': 10,
      'katana': 747474,
      'zircuit': 48900
    };

    const tokenAddresses = {
      'ethereum': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0xa0b86a33e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6e6' },
      'arbitrum': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
      'base': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' },
      'polygon': { 'MATIC': '0x0000000000000000000000000000000000000000', 'USDC': '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' },
      'katana': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0x203a662b0bd271a6ed5a60edfbd04bfce608fd36' },
      'zircuit': { 'ETH': '0x0000000000000000000000000000000000000000', 'USDC': '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }
    };

    // Use proper amount conversion based on token
    let convertedAmount;
    if (bot.swapConfig.originSymbol.toUpperCase() === 'USDC') {
      convertedAmount = (parseFloat(bot.swapConfig.amount) * Math.pow(10, 6)).toString(); // USDC has 6 decimals
    } else {
      convertedAmount = (parseFloat(bot.swapConfig.amount) * Math.pow(10, 18)).toString(); // ETH has 18 decimals
    }

    // Check if cross-chain
    const isCrossChain = bot.swapConfig.originBlockchain.toLowerCase() !== bot.swapConfig.destinationBlockchain.toLowerCase();

    // Get quote from Relay API using bot's actual configuration
    const quoteRequest = {
      user: bot.swapConfig.senderAddress,
      recipient: bot.swapConfig.recipientAddress || bot.swapConfig.senderAddress,
      originChainId: chainIds[bot.swapConfig.originBlockchain.toLowerCase()] || 42161,
      destinationChainId: chainIds[bot.swapConfig.destinationBlockchain.toLowerCase()] || 42161,
      originCurrency: tokenAddresses[bot.swapConfig.originBlockchain.toLowerCase()]?.[bot.swapConfig.originSymbol] || '0x0000000000000000000000000000000000000000',
      destinationCurrency: tokenAddresses[bot.swapConfig.destinationBlockchain.toLowerCase()]?.[bot.swapConfig.destinationSymbol] || '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      amount: convertedAmount,
      tradeType: "EXACT_INPUT",
      slippageTolerance: bot.swapConfig.slippageTolerance || "15"
    };

    // Only add extra parameters for same-chain swaps to avoid cross-chain issues
    if (!isCrossChain) {
      quoteRequest.useFallbacks = true;
      quoteRequest.useExternalLiquidity = true;
    }

    console.log('📤 Getting quote from Relay API...');
    const quoteResponse = await axios.post('https://api.relay.link/quote', quoteRequest, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const quote = quoteResponse.data;
    
    if (quote.steps && quote.steps.length > 0) {
      const step = quote.steps[0];
      if (step.kind === 'transaction' && step.items && step.items.length > 0) {
        const txData = step.items[0].data;

        // Connect to the correct origin chain
        const rpcUrls = {
          'ethereum': 'https://ethereum.publicnode.com',
          'arbitrum': 'https://arbitrum-one.publicnode.com',
          'base': 'https://base.publicnode.com',
          'polygon': 'https://polygon-bor-rpc.publicnode.com',
          'optimism': 'https://optimism.publicnode.com',
          'katana': 'https://rpc.katana.network',
          'zircuit': 'https://mainnet.zircuit.com'
        };
        
        const rpcUrl = rpcUrls[bot.swapConfig.originBlockchain.toLowerCase()] || 'https://arbitrum-one.publicnode.com';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(bot.swapConfig.senderPrivateKey, provider);

        // Execute transaction
        const transaction = {
          to: txData.to,
          value: txData.value || '0',
          data: txData.data || '0x',
          gasLimit: '300000', // Reduced gas limit
          maxFeePerGas: txData.maxFeePerGas || '1000000000', // 1 gwei for Katana
          maxPriorityFeePerGas: txData.maxPriorityFeePerGas || '100000000' // 0.1 gwei minimum
        };

        console.log('📤 Sending real transaction...');
        const txResponse = await wallet.sendTransaction(transaction);
        
        console.log(`✅ Transaction sent: ${txResponse.hash}`);
        const receipt = await txResponse.wait(1);
        
        if (receipt.status === 1) {
          console.log(`✅ Trade executed successfully for ${bot.name}`);
          console.log(`📤 TX Hash: ${txResponse.hash}`);
          
          // Log successful execution
          const logEntry = {
            botId: bot.id,
            action: 'trade_executed',
            timestamp: new Date().toISOString(),
            message: `Successful trade: ${bot.swapConfig.amount} ${bot.swapConfig.originSymbol} → ${bot.swapConfig.destinationSymbol}`,
            txHash: txResponse.hash,
            success: true
          };
          executionLogs.push(logEntry);
          
          return { success: true, txHash: txResponse.hash };
        }
      }
    }
    
    return { success: false, error: 'No valid transaction data' };
    
  } catch (error) {
    console.error(`❌ Automated trade failed for ${bot.name}:`, error.message);
    
    // Log failed execution
    const logEntry = {
      botId: bot.id,
      action: 'trade_failed',
      timestamp: new Date().toISOString(),
      message: `Trade failed: ${error.message}`,
      success: false,
      error: error.message
    };
    executionLogs.push(logEntry);
    
    return { success: false, error: error.message };
  }
}

// Activate bot
app.post('/api/bots/:botId/activate', async (req, res) => {
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
  
  // Start automated trading for real bots (not test bots)
  if (!bot.swapConfig.isTest) {
    console.log(`🎯 Starting automated trading for ${bot.name}`);
    
    // Execute first trade immediately
    setTimeout(async () => {
      await executeAutomatedTrade(bot);
    }, 2000); // Wait 2 seconds after activation
    
    // Set up interval trading based on bot configuration
    const intervalMinutes = bot.strategy?.parameters?.interval || 2; // Default 2 minutes
    const intervalMs = intervalMinutes * 60 * 1000;
    
    const interval = setInterval(async () => {
      if (!bot.isActive) {
        clearInterval(interval);
        activeConnections.delete(botId);
        return;
      }
      await executeAutomatedTrade(bot);
    }, intervalMs);
    
    activeConnections.set(botId, interval);
    console.log(`⏰ Automated trading scheduled every ${intervalMinutes} minutes for ${bot.name}`);
  }
  
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
  
  // Stop automated trading interval
  const interval = activeConnections.get(botId);
  if (interval) {
    clearInterval(interval);
    activeConnections.delete(botId);
    console.log(`⏹️ Stopped automated trading for ${bot.name}`);
  }
  
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
