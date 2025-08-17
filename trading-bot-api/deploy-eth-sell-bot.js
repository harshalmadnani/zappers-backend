const axios = require('axios');
const { ethers } = require('ethers');

// Bot configuration for selling 0.001 ETH for USDC on Arbitrum every minute
const botConfig = {
  name: "ETH to USDC Sell Bot - Arbitrum Katana",
  prompt: "Create a trading bot that sells 0.001 ETH for USDC on Arbitrum using Katana protocol every minute. The bot should monitor ETH prices and execute sells at optimal times.",
  swapConfig: {
    senderAddress: "", // Will be derived from private key
    senderPrivateKey: "0x365c551ce4a6a8b821666d0e5631739c72a38085b41f9ac6cb935f4128dde406",
    recipientAddress: "", // Will be derived from private key
    originSymbol: "ETH",
    originBlockchain: "arbitrum",
    destinationSymbol: "USDC",
    destinationBlockchain: "arbitrum",
    amount: "0.001",
    isTest: false,
    // Katana-specific configuration
    protocol: "katana",
    chainId: 42161, // Arbitrum mainnet
    slippageTolerance: "0.5", // 0.5% slippage
    executionInterval: 60000 // Every minute (60 seconds)
  }
};

// Derive Ethereum address from private key
function deriveAddressFromPrivateKey(privateKey) {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    throw new Error(`Invalid private key: ${error.message}`);
  }
}

// Deploy the bot
async function deployBot() {
  try {
    console.log('🚀 Deploying ETH sell bot...');
    
    // Derive addresses from private key
    const senderAddress = deriveAddressFromPrivateKey(botConfig.swapConfig.senderPrivateKey);
    botConfig.swapConfig.senderAddress = senderAddress;
    botConfig.swapConfig.recipientAddress = senderAddress; // Same address for sender and recipient
    
    console.log('🔑 Private Key:', botConfig.swapConfig.senderPrivateKey);
    console.log('📬 Derived Address:', senderAddress);
    console.log('📋 Bot configuration:', JSON.stringify(botConfig, null, 2));
    
    const response = await axios.post('https://zappers-backend.onrender.com/api/bots', botConfig, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      const bot = response.data.data;
      console.log('✅ Bot deployed successfully!');
      console.log('🆔 Bot ID:', bot.id);
      console.log('📱 Bot Name:', bot.name);
      console.log('🌐 Deployment URL:', bot.vercelDeploymentUrl);
      
      // Activate the bot
      console.log('🔌 Activating bot...');
      const activateResponse = await axios.post(
        `https://zappers-backend.onrender.com/api/bots/${bot.id}/activate`,
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (activateResponse.data.success) {
        console.log('✅ Bot activated successfully!');
        console.log('🤖 Bot is now running and will sell 0.001 ETH for USDC every minute');
        console.log('📍 Using address:', senderAddress);
        console.log('🔗 Arbitrum chain ID:', botConfig.swapConfig.chainId);
      } else {
        console.log('❌ Failed to activate bot:', activateResponse.data.error);
      }
      
    } else {
      console.log('❌ Failed to deploy bot:', response.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error deploying bot:', error.response?.data || error.message);
  }
}

// Run the deployment
deployBot();
