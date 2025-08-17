# AI Trading Bot API

An AI-powered trading bot platform that uses OpenAI o3-mini to generate custom trading bots, monitors real-time price data via Hyperliquid WebSocket, executes trades through NEAR Intents, and deploys bots to Vercel.

## 🎯 What It Does

The Trading Bot API is an **AI-powered automated trading platform** that creates, deploys, and manages custom trading bots across multiple blockchains. It combines cutting-edge technologies to provide a complete trading automation solution:

### Core Functionality:
1. **AI Bot Generation** - Uses OpenAI o3-mini to generate custom trading bot code from natural language prompts
2. **Real-time Market Monitoring** - Connects to Hyperliquid WebSocket for live price data
3. **Cross-chain Trading** - Executes swaps via NEAR Intents API across multiple blockchains  
4. **Serverless Deployment** - Automatically deploys generated bots to Vercel as serverless functions
5. **Strategy Management** - Supports various trading strategies (price thresholds, intervals, ranges, custom logic)
6. **Performance Tracking** - Logs all trades and provides optimization suggestions

## 🏗️ Technical Architecture

The system follows a microservices architecture with the following key components:

### Entry Points:
- **`src/index.ts`** - Main TypeScript server with full bot management capabilities
- **`enhanced-server.js`** - Enhanced JavaScript version with in-memory bot storage
- **`simple-server.js`** - Minimal JavaScript version for basic testing

### Core Services:

#### 1. BotManager (`src/services/bot-manager.ts`)
- Central orchestrator managing the entire bot lifecycle
- Handles bot creation, activation, deactivation, and deletion
- Manages WebSocket connections and price monitoring
- Evaluates trading strategies and executes trades
- Implements retry logic with cooldown periods after failures

#### 2. OpenAI Service (`src/services/openai.ts`)
- Generates trading bot code using OpenAI o3-mini model
- Converts natural language prompts into executable TypeScript code
- Extracts trading strategies from user descriptions
- Optimizes strategies based on performance data

#### 3. Hyperliquid WebSocket Service (`src/services/hyperliquid.ts`)
- Connects to Hyperliquid for real-time trade data
- Handles reconnection logic and subscription management
- Supports both mainnet and testnet environments
- Processes trade messages and emits price updates

#### 4. NEAR Intents Service (`src/services/near-intents.ts`)
- Executes cross-chain swaps via NEAR Intents API
- Validates swap configurations
- Handles API communication with proper error handling
- Supports multiple blockchains (BASE, ARB, ETH, OP, POL, BSC, AVAX)

#### 5. Vercel Deploy Service (`src/services/vercel-deploy.ts`)
- Automatically deploys generated bots to Vercel
- Creates serverless functions with environment variables
- Manages deployment lifecycle (create, status, delete)
- Validates Vercel API tokens

#### 6. Storage Service (`src/services/storage.ts`)
- Persists bot configurations and execution logs to JSON files
- Handles data serialization/deserialization
- Manages bot state persistence across server restarts

## 🔄 Complete Data Flow

### 1. Bot Creation Process:
```
User Request → API Route → BotManager.createBot() → OpenAI Code Generation → Vercel Deployment → Bot Storage
```

1. User sends a POST request with bot name, prompt, and swap configuration
2. `BotManager` validates the swap configuration via NEAR Intents
3. `OpenAI Service` generates custom trading code based on the user prompt
4. `Vercel Deploy Service` packages and deploys the bot as a serverless function
5. Bot configuration is stored locally via `Storage Service`

### 2. Bot Activation & Trading:
```
Bot Activation → WebSocket Connection → Price Monitoring → Strategy Evaluation → Trade Execution → Logging
```

1. When activated, bot establishes Hyperliquid WebSocket connection
2. Real-time trade data triggers price update events
3. `BotManager` evaluates trading conditions based on bot's strategy
4. If conditions are met, executes swap via NEAR Intents API
5. All actions are logged with success/failure status and cooldown management

### 3. Strategy Types Supported:

#### Price Threshold Strategy:
```typescript
if (currentPrice <= buyThreshold) execute('buy')
if (currentPrice >= sellThreshold) execute('sell')
```

#### Price Range Strategy:
```typescript
if (currentPrice <= minPrice) execute('buy')
if (currentPrice >= maxPrice) execute('sell')
```

#### Interval Strategy:
```typescript
if (timeSinceLastExecution >= interval) execute('buy')
```

#### Custom Strategy:
Uses AI to implement complex logic based on user prompts

## 🛠️ Configuration & Environment

### Required Environment Variables:
```env
OPENAI_API_KEY=sk-proj-your-openai-key-here
VERCEL_TOKEN=your-vercel-token-here
RELAY_API_KEY=your-relay-api-key-here  # Optional
IS_TESTNET=false
PORT=3000
```

## 🚀 Deployment Architecture

### Main API Server:
- Runs on Node.js/Express
- Can be deployed to Vercel, Render, or any cloud platform
- Handles bot management and orchestration

### Individual Bot Deployments:
- Each bot becomes an independent Vercel serverless function
- Contains generated trading logic specific to user requirements
- Monitors prices and executes trades autonomously
- Can be controlled via main API

## 🔒 Security & Error Handling

### Security Features:
- API key validation for all external services
- Private key validation for blockchain transactions
- Test mode support for safe development
- Input validation and sanitization

### Error Handling:
- Comprehensive try-catch blocks throughout
- Automatic retry logic with exponential backoff
- Cooldown periods after failed trades
- Detailed logging for debugging

### Monitoring:
- Real-time bot status tracking
- Trade execution logging
- Performance metrics collection
- Health checks for all services

## Features

- 🤖 **AI Bot Generation**: Uses OpenAI o3-mini to generate custom trading bot code based on user prompts
- 📊 **Real-time Price Monitoring**: Connects to Hyperliquid WebSocket for live token price data
- 🔄 **Cross-chain Trading**: Executes swaps via NEAR Intents API across multiple blockchains
- ☁️ **Auto-deployment**: Automatically deploys generated bots to Vercel as serverless functions
- 🎯 **Smart Strategies**: Supports price thresholds, ranges, intervals, and custom trading logic
- 📈 **Performance Tracking**: Logs all trades and provides optimization suggestions

## Quick Start

### 1. Environment Setup

```bash
# Clone and setup
git clone <repo>
cd trading-bot-api
npm install

# Copy environment file and configure
cp env.example .env
```

Edit `.env` with your API keys:
```env
OPENAI_API_KEY=sk-proj-your-openai-key-here
VERCEL_TOKEN=your-vercel-token-here
RELAY_API_KEY=your-relay-api-key-here  # Optional
IS_TESTNET=false
```

### 2. Build and Run

```bash
# Build the project
npm run build

# Start the server
npm start

# Or run in development mode
npm run dev
```

### 3. Test the API

```bash
# Check health
curl http://localhost:3000/api/health

# Get API info
curl http://localhost:3000/api/info

# Get example bot configuration
curl -X POST http://localhost:3000/api/example-bot
```

## API Endpoints

### Bot Management

#### Create Bot
```bash
POST /api/bots
Content-Type: application/json

{
  "name": "My Trading Bot",
  "prompt": "Create a bot that buys when price drops below $1.50 and sells when it goes above $2.00",
  "swapConfig": {
    "senderAddress": "0x...",
    "senderPrivateKey": "0x...",
    "recipientAddress": "0x...",
    "originSymbol": "USDC",
    "originBlockchain": "BASE",
    "destinationSymbol": "ARB",
    "destinationBlockchain": "ARB",
    "amount": "10.0",
    "isTest": false
  }
}
```

#### List All Bots
```bash
GET /api/bots
```

#### Get Specific Bot
```bash
GET /api/bots/:botId
```

#### Activate Bot
```bash
POST /api/bots/:botId/activate
```

#### Deactivate Bot
```bash
POST /api/bots/:botId/deactivate
```

#### Delete Bot
```bash
DELETE /api/bots/:botId
```

#### Get Bot Logs
```bash
GET /api/bots/:botId/logs
```

#### Optimize Bot Strategy
```bash
POST /api/bots/:botId/optimize
```

### Market Data

#### Get Active Bots
```bash
GET /api/bots/status/active
```

#### Get Price History
```bash
GET /api/bots/market/price-history?limit=100
```

## Trading Strategies

The API supports several trading strategy types:

### 1. Price Threshold
```javascript
{
  "type": "price_threshold",
  "parameters": {
    "buyThreshold": 1.50,
    "sellThreshold": 2.00
  }
}
```

### 2. Price Range
```javascript
{
  "type": "price_range",
  "parameters": {
    "minPrice": 1.00,
    "maxPrice": 2.50
  }
}
```

### 3. Interval-based
```javascript
{
  "type": "interval",
  "parameters": {
    "interval": 1800000 // 30 minutes in milliseconds
  }
}
```

### 4. Custom Logic
```javascript
{
  "type": "custom",
  "parameters": {
    "customLogic": "Your custom trading logic description"
  }
}
```

## Supported Blockchains

- **BASE**: Base network
- **ARB**: Arbitrum
- **ETH**: Ethereum mainnet
- **OP**: Optimism
- **POL**: Polygon
- **BSC**: Binance Smart Chain
- **AVAX**: Avalanche

## Example Bot Prompts

### DCA Bot
```
"Create a dollar-cost averaging bot that buys $10 worth of ARB tokens every hour when the price is below $1.50"
```

### Momentum Bot
```
"Create a momentum bot that buys when price increases by 5% in the last hour and sells when it drops by 3%"
```

### Range Trading Bot
```
"Create a range trading bot that buys USDC with ETH when ETH price is below $3000 and sells when above $3500"
```

### Volatility Bot
```
"Create a volatility bot that executes trades when price volatility exceeds 10% in a 15-minute window"
```

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Prompt   │───▶│   OpenAI o3-mini │───▶│  Generated Bot  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐             │
│Hyperliquid WS   │───▶│  Price Monitoring│◀────────────┘
└─────────────────┘    └──────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ NEAR Intents API│◀───│ Trading Execution│───▶│ Vercel Deployment│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Complete Transaction Flow

The Relay integration provides a complete cross-chain swap execution flow:

### 1. Quote Generation
```javascript
// Get a quote for cross-chain swap
const quote = await relayService.getQuote({
  user: '0x...',
  originChainId: 8453,      // Base
  destinationChainId: 42161, // Arbitrum
  originCurrency: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
  destinationCurrency: '0x0000000000000000000000000000000000000000', // ETH
  amount: '100000' // 0.1 USDC
});
```

### 2. Transaction Execution
```javascript
// Execute the swap with real blockchain transactions
const result = await relayService.executeSwap({
  senderAddress: '0x...',
  senderPrivateKey: '0x...',
  originSymbol: 'USDC',
  originBlockchain: 'base',
  destinationSymbol: 'ETH', 
  destinationBlockchain: 'arbitrum',
  amount: '0.1'
});
```

### 3. Status Monitoring
```javascript
// Monitor cross-chain transaction status
const status = await relayService.getExecutionStatus(requestId);
// Returns: 'pending', 'success', 'failure'
```

### 4. Complete Flow Features
- ✅ **Real Transaction Signing**: Uses ethers.js for secure transaction signing
- ✅ **Gas Estimation**: Automatic gas limit and price estimation
- ✅ **Balance Verification**: Checks wallet balance before execution
- ✅ **Cross-Chain Monitoring**: Tracks transaction status across chains
- ✅ **Error Handling**: Comprehensive error handling and retry logic
- ✅ **Multiple Steps**: Handles multi-step cross-chain transactions

## Testing

The API includes comprehensive testing endpoints and utilities:

### Balance Checker
```bash
# Check wallet balances across multiple chains
node check-balances.js
```

### Relay API Testing
```bash
# Test Relay quotes (safe - no transactions)
node test-relay-simple.js

# Test full transaction flow (dry run)
node test-relay-execution.js --dry-run

# Execute real transactions (WARNING: costs real money)
node test-relay-execution.js
```

### Full Integration Testing
```bash
# Test complete bot creation and activation
node test-full-integration.js
```

### API Health Testing
```bash
# Test health
curl http://localhost:3000/api/health

# Test with example configuration
curl -X POST http://localhost:3000/api/example-bot

# Create a test bot (requires valid API keys)
curl -X POST http://localhost:3000/api/bots \
  -H "Content-Type: application/json" \
  -d @test-bot-request.json
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Private Keys**: Never hardcode private keys. Use environment variables or secure key management.
2. **API Keys**: Store all API keys securely and rotate them regularly.
3. **Test Mode**: Always test with `isTest: true` before live trading.
4. **Validation**: The API validates all inputs but additional validation is recommended.
5. **Rate Limits**: Be aware of rate limits on OpenAI, Hyperliquid, and Vercel APIs.

## Deployment to Vercel

The generated bots are automatically deployed to Vercel. Each bot becomes a serverless function that:

1. Monitors price data via WebSocket
2. Executes trading logic based on generated strategy
3. Logs all activities and errors
4. Can be monitored and controlled via the main API

## Error Handling

The API includes comprehensive error handling:

- **OpenAI Errors**: Invalid API keys, rate limits, model issues
- **WebSocket Errors**: Connection failures, subscription issues
- **Trading Errors**: Invalid swap configurations, insufficient funds
- **Deployment Errors**: Vercel deployment failures, configuration issues

## Monitoring and Logs

All bot activities are logged and can be accessed via:

```bash
# Get execution logs for a specific bot
GET /api/bots/:botId/logs

# Get price history
GET /api/bots/market/price-history

# Get active bots status
GET /api/bots/status/active
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the API health endpoint: `/api/health`
- Review the API info: `/api/info`  
- Check server logs for detailed error information