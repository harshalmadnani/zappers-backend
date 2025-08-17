# The Graph API Integration

This document explains how The Graph Token API has been integrated into the trading bot system to provide wallet balance tracking, historical price analysis, and portfolio management features.

## Overview

The Graph Token API integration provides:
- **Wallet Balance Tracking**: Get real-time token balances for any EVM wallet
- **Historical Price Data**: Access historical price information for tokens
- **Token Metadata**: Retrieve token information including decimals, symbols, and verification status
- **Portfolio Analysis**: Calculate total portfolio value across multiple chains
- **Token Search**: Find tokens by symbol or name across supported chains
- **Transfer History**: Track token transfers for wallets

## API Key

The system uses a JWT token for authentication. Set the `GRAPH_API_KEY` environment variable with your JWT token from The Graph API.

## Supported Chains

The Graph Token API supports the following chains:
- Ethereum (1)
- Optimism (10)
- Cronos (25)
- BSC (56)
- Gnosis (100)
- Polygon (137)
- Manta Pacific (169)
- Boba (288)
- zkSync Era (324)
- Base (8453)
- Arbitrum One (42161)
- Avalanche (43114)
- Linea (59144)
- Scroll (534352)
- Zora (7777777)

## Usage

### 1. Basic Service Usage

```typescript
import { GraphService } from './services/graph';

// Initialize the service
const graphService = new GraphService(); // Uses GRAPH_API_KEY env var

// Get wallet balances
const balances = await graphService.getWalletBalances('0x...', 1); // Ethereum

// Get historical prices
const prices = await graphService.getHistoricalPrices('0x...', 1, '1h', 100);

// Get token info
const tokenInfo = await graphService.getTokenInfo('0x...', 1);
```

### 2. Bot Manager Integration

```typescript
import { BotManager } from './services/bot-manager';

// Initialize bot manager with Graph API support
const botManager = new BotManager(
  openaiApiKey,
  vercelToken,
  relayApiKey,
  'SOL',
  false,
  process.env.GRAPH_API_KEY // Graph API JWT token
);

// Create bot with balance checking
const bot = await botManager.createBotWithBalanceCheck(request);

// Get wallet balances
const balances = await botManager.getWalletBalances('0x...');

// Get portfolio value
const portfolio = await botManager.getPortfolioValue('0x...');
```

### 3. AI Bot Generation with Graph API

When creating trading bots, the AI will automatically include Graph API functionality if the user explicitly requests:
- Wallet balance tracking
- Historical price analysis
- Portfolio management features
- Token metadata validation

The AI will generate code that:
- Checks wallet balances before executing swaps
- Uses historical price data for strategy decisions
- Validates token addresses and decimals
- Implements portfolio tracking for multi-token strategies

## Key Features

### Wallet Balance Tracking

```typescript
// Get all token balances for a wallet
const balances = await graphService.getWalletBalances('0x...');

// Get balances for specific chain
const ethBalances = await graphService.getWalletBalances('0x...', 1);

// Check if wallet has sufficient balance
const usdcBalance = balances.find(b => b.token.symbol === 'USDC');
if (usdcBalance && parseFloat(usdcBalance.formattedAmount) >= requiredAmount) {
  // Proceed with swap
}
```

### Historical Price Analysis

```typescript
// Get hourly prices for the last 100 hours
const prices = await graphService.getHistoricalPrices(
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  1, // Ethereum
  '1h',
  100
);

// Convert to TokenPriceData format for compatibility
const priceData = graphService.convertToTokenPriceData(prices);
```

### Portfolio Management

```typescript
// Get complete portfolio analysis
const portfolio = await graphService.getPortfolioValue('0x...', [1, 137, 8453]);

console.log(`Total Portfolio Value: $${portfolio.totalValueUSD}`);
console.log(`Number of Tokens: ${portfolio.balances.length}`);

// Portfolio breakdown by chain
Object.entries(portfolio.chains).forEach(([chainId, value]) => {
  console.log(`Chain ${chainId}: $${value}`);
});
```

### Token Search and Validation

```typescript
// Search for USDC tokens across all chains
const usdcTokens = await graphService.searchTokens('USDC');

// Get specific token metadata
const tokenInfo = await graphService.getTokenInfo(
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  1
);

// Validate token decimals for amount calculations
const amount = ethers.parseUnits('100', tokenInfo.decimals);
```

## Rate Limiting

The Graph API service includes built-in rate limiting:
- 100ms delay between requests
- Automatic retry logic for failed requests
- Error handling with graceful fallbacks

## Error Handling

The service provides comprehensive error handling:

```typescript
try {
  const balances = await graphService.getWalletBalances('0x...');
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded
    console.log('Rate limit exceeded, retrying...');
  } else if (error.response?.status === 404) {
    // Wallet not found or no balances
    console.log('No balances found for wallet');
  } else {
    // Other errors
    console.error('Graph API error:', error.message);
  }
}
```

## Integration with Trading Bots

The Graph API is automatically integrated into trading bot generation when users request:

1. **Balance Checking**: "Check my wallet balance before trading"
2. **Historical Analysis**: "Use historical price data to make decisions"
3. **Portfolio Tracking**: "Track my portfolio value"
4. **Multi-token Strategies**: "Trade multiple tokens based on portfolio allocation"

Example bot prompt that would trigger Graph API usage:
> "Create a trading bot that checks my USDC balance on Ethereum, analyzes the historical price of SOL, and only executes swaps if my portfolio value is above $10,000"

## Testing

Use the test script to verify Graph API functionality:

```bash
# Set environment variable with your JWT token
export GRAPH_API_KEY="your_jwt_token_here"

# Run test
npx ts-node src/services/graph-test.ts
```

The test script will:
- Check API status
- List supported chains
- Test wallet balance retrieval
- Test token information lookup
- Test token search functionality
- Test historical price data
- Test portfolio value calculation

## Best Practices

1. **Use Graph API Only When Needed**: The API is only initialized if explicitly requested
2. **Cache Data**: Cache frequently accessed data to reduce API calls
3. **Handle Errors Gracefully**: Always provide fallback mechanisms
4. **Rate Limiting**: Respect API rate limits with built-in delays
5. **Validate Chain Support**: Check if a chain is supported before making requests

## Environment Variables

For production deployment, set the following environment variable:

```bash
GRAPH_API_KEY=your_jwt_token_here
```

## API Endpoints Used

The integration uses the following Graph Token API endpoints:
- `GET /balances/evm/{address}` - Get wallet token balances
- `GET /tokens/{chainId}/{tokenAddress}/prices` - Get historical prices
- `GET /tokens/{chainId}/{tokenAddress}` - Get token metadata
- `GET /transfers/{address}` - Get token transfers
- `GET /search/tokens` - Search for tokens

## Troubleshooting

Common issues and solutions:

1. **API Key Issues**: Ensure the JWT token is correctly set
2. **Chain Not Supported**: Check if the chain ID is in the supported chains list
3. **Rate Limits**: The service automatically handles rate limiting
4. **Network Errors**: The service includes retry logic for network failures
5. **Invalid Addresses**: Validate wallet and token addresses before making requests

For more information, refer to [The Graph Token API documentation](https://thegraph.com/docs/en/token-api/quick-start/).
