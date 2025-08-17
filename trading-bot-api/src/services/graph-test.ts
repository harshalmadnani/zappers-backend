import { GraphService } from './graph';

/**
 * Test script for The Graph API service
 * This demonstrates how to use the Graph service to get wallet balances and historical prices
 * 
 * To run this test:
 * 1. Set the GRAPH_API_KEY environment variable to server_778bdfcc22f59ad72c912742b9a03b13
 * 2. Run: npx ts-node src/services/graph-test.ts
 */

async function testGraphAPI() {
  // Initialize the Graph service with the JWT token
  const jwtToken = 'eyJhbGciOiJLTVNFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3OTE0MzQ2NDYsImp0aSI6ImUzMGZmZmU2LWVjZjQtNGQ3OC1hZGZiLTU0ZjZlZTZhOWIwMCIsImlhdCI6MTc1NTQzNDY0NiwiaXNzIjoiZGZ1c2UuaW8iLCJzdWIiOiIwY2FoaWViYWE0MDkyM2MyOGMwNGQiLCJ2IjoxLCJha2kiOiIxMDk3MjZhNGI2ZjcwNDM3M2QwZWUxYjlkMWRiMjk1MzE1MjY2YzhhNDlmZWQ3YTlmNjMyYTk1NGM3YTVhMGIyIiwidWlkIjoiMGNhaGllYmFhNDA5MjNjMjhjMDRkIn0.tJ4YIyNEWvUl4-jFuQee6VwCZGPQqzxyYq1-vrivZroLSuSHgfXhXzIc6b_s4b3Vzz3tV1HVinRwX0nGpNi0rA';
  const graphService = new GraphService(jwtToken);
  
  console.log('🧪 Testing The Graph API Service\n');
  
  try {
    // Test 1: Get supported chains
    console.log('🌐 Supported chains:');
    const chains = graphService.getSupportedChains();
    Object.entries(chains).slice(0, 5).forEach(([chainId, name]) => {
      console.log(`  Chain ${chainId}: ${name}`);
    });
    console.log(`  ... and ${Object.keys(chains).length - 5} more chains\n`);
    
    // Test 2: Get wallet balances for a sample address (Vitalik's address)
    const sampleWallet = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    console.log(`💰 Getting wallet balances for ${sampleWallet}...`);
    
    try {
      const balances = await graphService.getWalletBalances(sampleWallet, 1); // Ethereum mainnet
      console.log(`Found ${balances.length} token balances:`);
      
      balances.slice(0, 5).forEach(balance => {
        console.log(`  ${balance.token.symbol}: ${balance.formattedAmount} (${balance.valueUSD ? '$' + balance.valueUSD.toFixed(2) : 'N/A'})`);
      });
      
      if (balances.length > 5) {
        console.log(`  ... and ${balances.length - 5} more tokens`);
      }
      console.log('');
    } catch (error) {
      console.log('❌ Wallet balance test failed:', error instanceof Error ? error.message : error);
      console.log('');
    }
    
    // Test 3: Test portfolio value calculation
    console.log(`💼 Calculating portfolio value for ${sampleWallet}...`);
    
    try {
      const portfolio = await graphService.getPortfolioValue(sampleWallet, [1]); // Ethereum only
      console.log(`Portfolio Summary:`);
      console.log(`  Total Value: $${portfolio.totalValueUSD.toFixed(2)}`);
      console.log(`  Number of Tokens: ${portfolio.balances.length}`);
      console.log(`  Chains:`);
      
      Object.entries(portfolio.chains).forEach(([chainId, value]) => {
        const chainName = chains[parseInt(chainId)];
        console.log(`    ${chainName}: $${value.toFixed(2)}`);
      });
      console.log('');
    } catch (error) {
      console.log('❌ Portfolio value test failed:', error instanceof Error ? error.message : error);
      console.log('');
    }
    
    console.log('✅ Graph API testing completed!');
    
  } catch (error) {
    console.error('❌ Graph API test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testGraphAPI().catch(console.error);
}

export { testGraphAPI };
