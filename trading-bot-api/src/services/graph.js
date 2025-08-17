"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphService = void 0;
const events_1 = require("events");
class GraphService extends events_1.EventEmitter {
    constructor(apiKey) {
        super();
        this.baseUrl = 'https://token-api.thegraph.com';
        this.apiKey = apiKey;
        this.rateLimitDelay = 100; // 100ms between requests
        this.lastRequestTime = 0;
    }
    async makeRequest(endpoint, options) {
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            ...options?.headers
        };
        try {
            console.log(`📡 Graph API Request: ${endpoint}`);
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Graph API Error (${response.status}): ${errorText}`);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error(`❌ Graph API request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    // Get wallet balances across multiple chains
    async getWalletBalances(address, chainIds) {
        try {
            console.log(`💰 Fetching wallet balances for ${address}`);
            // If specific chains requested, fetch each one
            if (chainIds && chainIds.length > 0) {
                const balances = [];
                for (const chainId of chainIds) {
                    try {
                        const chainName = this.getChainName(chainId);
                        const endpoint = `/balances/${chainName.toLowerCase()}/${address}`;
                        const response = await this.makeRequest(endpoint);
                        balances.push({
                            address,
                            chainId,
                            chainName,
                            tokens: response.tokens || [],
                            totalValueUSD: response.totalValueUSD || 0,
                            lastUpdatedAt: new Date().toISOString()
                        });
                    }
                    catch (error) {
                        console.warn(`⚠️ Failed to fetch balances for chain ${chainId}:`, error);
                    }
                }
                return balances;
            }
            // Default: fetch EVM balances (most common)
            const endpoint = `/balances/evm/${address}`;
            const response = await this.makeRequest(endpoint);
            return [{
                    address,
                    chainId: 1, // Ethereum mainnet as default
                    chainName: 'Ethereum',
                    tokens: response.tokens || [],
                    totalValueUSD: response.totalValueUSD || 0,
                    lastUpdatedAt: new Date().toISOString()
                }];
        }
        catch (error) {
            console.error(`❌ Failed to fetch wallet balances for ${address}:`, error);
            throw error;
        }
    }
    // Get historical price data for a token
    async getTokenPriceHistory(contractAddress, chainId = 1, timeframe = '1d', limit = 100) {
        try {
            const chainName = this.getChainName(chainId);
            console.log(`📊 Fetching price history for ${contractAddress} on ${chainName}`);
            const endpoint = `/prices/${chainName.toLowerCase()}/${contractAddress}/history`;
            const params = new URLSearchParams({
                timeframe,
                limit: limit.toString()
            });
            const response = await this.makeRequest(`${endpoint}?${params}`);
            return {
                contractAddress,
                symbol: response.symbol || 'UNKNOWN',
                prices: response.prices || [],
                timeframe,
                chainId
            };
        }
        catch (error) {
            console.error(`❌ Failed to fetch price history for ${contractAddress}:`, error);
            throw error;
        }
    }
    // Get current token price and market data
    async getTokenInfo(contractAddress, chainId = 1) {
        try {
            const chainName = this.getChainName(chainId);
            console.log(`🔍 Fetching token info for ${contractAddress} on ${chainName}`);
            const endpoint = `/tokens/${chainName.toLowerCase()}/${contractAddress}`;
            const response = await this.makeRequest(endpoint);
            return {
                contractAddress,
                name: response.name || 'Unknown Token',
                symbol: response.symbol || 'UNKNOWN',
                decimals: response.decimals || 18,
                totalSupply: response.totalSupply || '0',
                chainId,
                logoURI: response.logoURI,
                verified: response.verified || false,
                description: response.description,
                website: response.website,
                twitter: response.twitter,
                marketData: {
                    price: response.price || 0,
                    marketCap: response.marketCap || 0,
                    volume24h: response.volume24h || 0,
                    priceChange24h: response.priceChange24h || 0,
                    priceChange7d: response.priceChange7d || 0,
                    holders: response.holders || 0
                },
                security: response.security
            };
        }
        catch (error) {
            console.error(`❌ Failed to fetch token info for ${contractAddress}:`, error);
            throw error;
        }
    }
    // Get swap/transaction history for a wallet
    async getWalletSwapHistory(address, chainId = 1, limit = 50) {
        try {
            const chainName = this.getChainName(chainId);
            console.log(`🔄 Fetching swap history for ${address} on ${chainName}`);
            const endpoint = `/swaps/${chainName.toLowerCase()}/${address}`;
            const params = new URLSearchParams({
                limit: limit.toString()
            });
            const response = await this.makeRequest(`${endpoint}?${params}`);
            return response.swaps || [];
        }
        catch (error) {
            console.error(`❌ Failed to fetch swap history for ${address}:`, error);
            return []; // Return empty array on error
        }
    }
    // Get top tokens by market cap for a specific chain
    async getTopTokens(chainId = 1, limit = 100) {
        try {
            const chainName = this.getChainName(chainId);
            console.log(`🏆 Fetching top ${limit} tokens on ${chainName}`);
            const endpoint = `/tokens/${chainName.toLowerCase()}/top`;
            const params = new URLSearchParams({
                limit: limit.toString()
            });
            const response = await this.makeRequest(`${endpoint}?${params}`);
            return response.tokens || [];
        }
        catch (error) {
            console.error(`❌ Failed to fetch top tokens for chain ${chainId}:`, error);
            return [];
        }
    }
    // Search for tokens by name or symbol
    async searchTokens(query, chainId, limit = 20) {
        try {
            console.log(`🔎 Searching for tokens: ${query}`);
            const endpoint = '/tokens/search';
            const params = new URLSearchParams({
                q: query,
                limit: limit.toString()
            });
            if (chainId) {
                params.append('chainId', chainId.toString());
            }
            const response = await this.makeRequest(`${endpoint}?${params}`);
            return response.tokens || [];
        }
        catch (error) {
            console.error(`❌ Failed to search tokens for query "${query}":`, error);
            return [];
        }
    }
    // Convert Graph data to TokenPriceData format for compatibility
    convertToTokenPriceData(graphData) {
        return graphData.prices.map(price => ({
            timestamp: price.timestamp,
            price: price.price,
            marketDepthUSDUp: 0, // Not available from Graph
            marketDepthUSDDown: 0, // Not available from Graph
            volume24h: price.volume,
            baseSymbol: graphData.symbol,
            quoteSymbol: 'USD'
        }));
    }
    // Get portfolio analytics for a wallet
    async getWalletAnalytics(address, chainIds) {
        try {
            const balances = await this.getWalletBalances(address, chainIds);
            let totalValueUSD = 0;
            let tokenCount = 0;
            const allTokens = [];
            const chainDistribution = {};
            // Aggregate data across all chains
            for (const chainBalance of balances) {
                totalValueUSD += chainBalance.totalValueUSD;
                tokenCount += chainBalance.tokens.length;
                allTokens.push(...chainBalance.tokens);
                chainDistribution[chainBalance.chainId] = chainBalance.totalValueUSD;
            }
            // Sort tokens by value
            const topHoldings = allTokens
                .filter(token => token.price && token.price.value > 0)
                .sort((a, b) => {
                const aValue = parseFloat(a.formattedAmount) * (a.price?.value || 0);
                const bValue = parseFloat(b.formattedAmount) * (b.price?.value || 0);
                return bValue - aValue;
            })
                .slice(0, 10);
            // Calculate risk score (simplified)
            const riskScore = this.calculateRiskScore(allTokens);
            // Calculate diversification score
            const diversificationScore = this.calculateDiversificationScore(allTokens);
            return {
                totalValueUSD,
                tokenCount,
                topHoldings,
                chainDistribution,
                riskScore,
                diversificationScore
            };
        }
        catch (error) {
            console.error(`❌ Failed to get wallet analytics for ${address}:`, error);
            throw error;
        }
    }
    calculateRiskScore(tokens) {
        // Simplified risk calculation based on token verification and market cap
        let totalValue = 0;
        let riskWeightedValue = 0;
        for (const token of tokens) {
            const tokenValue = parseFloat(token.formattedAmount) * (token.price?.value || 0);
            totalValue += tokenValue;
            let riskMultiplier = 1;
            if (!token.verified)
                riskMultiplier += 0.5;
            if (!token.marketData || token.marketData.marketCap < 1000000)
                riskMultiplier += 0.3;
            riskWeightedValue += tokenValue * riskMultiplier;
        }
        return totalValue > 0 ? Math.min((riskWeightedValue / totalValue) * 100, 100) : 0;
    }
    calculateDiversificationScore(tokens) {
        if (tokens.length === 0)
            return 0;
        // Calculate Herfindahl-Hirschman Index for diversification
        const totalValue = tokens.reduce((sum, token) => {
            return sum + (parseFloat(token.formattedAmount) * (token.price?.value || 0));
        }, 0);
        if (totalValue === 0)
            return 0;
        let hhi = 0;
        for (const token of tokens) {
            const tokenValue = parseFloat(token.formattedAmount) * (token.price?.value || 0);
            const marketShare = tokenValue / totalValue;
            hhi += marketShare * marketShare;
        }
        // Convert HHI to diversification score (0-100, higher is more diversified)
        return Math.max(0, (1 - hhi) * 100);
    }
    getChainName(chainId) {
        const chainMap = {
            1: 'ethereum',
            10: 'optimism',
            25: 'cronos',
            56: 'bsc',
            100: 'gnosis',
            137: 'polygon',
            169: 'manta',
            288: 'boba',
            324: 'zksync',
            8453: 'base',
            42161: 'arbitrum',
            43114: 'avalanche',
            59144: 'linea',
            534352: 'scroll',
            7777777: 'zora'
        };
        return chainMap[chainId] || 'ethereum';
    }
    // Utility method to get supported chains
    getSupportedChains() {
        return [
            { chainId: 1, name: 'ethereum', displayName: 'Ethereum' },
            { chainId: 56, name: 'bsc', displayName: 'BNB Smart Chain' },
            { chainId: 8453, name: 'base', displayName: 'Base' },
            { chainId: 137, name: 'polygon', displayName: 'Polygon' },
            { chainId: 42161, name: 'arbitrum', displayName: 'Arbitrum' },
            { chainId: 10, name: 'optimism', displayName: 'Optimism' },
            { chainId: 43114, name: 'avalanche', displayName: 'Avalanche' }
        ];
    }
    // Health check method
    async healthCheck() {
        try {
            // Simple health check by fetching supported chains or making a minimal request
            await this.makeRequest('/health');
            return true;
        }
        catch (error) {
            console.error('❌ Graph API health check failed:', error);
            return false;
        }
    }
}
exports.GraphService = GraphService;
