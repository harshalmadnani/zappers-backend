"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var dotenv_1 = require("dotenv");
var bot_manager_1 = require("./services/bot-manager");
var bots_1 = require("./routes/bots");
// Load environment variables
dotenv_1.default.config();
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Environment variables validation
var requiredEnvVars = [
    'OPENAI_API_KEY',
    'VERCEL_TOKEN'
];
var missingEnvVars = requiredEnvVars.filter(function (varName) { return !process.env[varName]; });
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(function (varName) { return console.error("   - ".concat(varName)); });
    process.exit(1);
}
// Initialize services
var botManager = new bot_manager_1.BotManager(process.env.OPENAI_API_KEY, process.env.VERCEL_TOKEN, process.env.NEAR_INTENTS_API_URL || 'https://near-api-4kbh.onrender.com', 'SOL', // Default coin, but each bot can specify its own
process.env.IS_TESTNET === 'true');
// Event listeners for bot manager
botManager.on('botCreated', function (bot) {
    console.log("\uD83C\uDF89 Bot created: ".concat(bot.name, " (").concat(bot.id, ")"));
});
botManager.on('botActivated', function (bot) {
    console.log("\uD83D\uDE80 Bot activated: ".concat(bot.name));
});
botManager.on('botDeactivated', function (bot) {
    console.log("\u23F9\uFE0F Bot deactivated: ".concat(bot.name));
});
botManager.on('tradeExecuted', function (_a) {
    var bot = _a.bot, action = _a.action, price = _a.price, result = _a.result;
    console.log("\uD83D\uDCB1 Trade executed by ".concat(bot.name, ": ").concat(action, " at $").concat(price, " - ").concat(result.success ? 'SUCCESS' : 'FAILED'));
});
// Routes
app.use('/api/bots', (0, bots_1.createBotsRouter)(botManager));
// Health check
app.get('/api/health', function (req, res) {
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
app.get('/api/info', function (req, res) {
    var activeBots = botManager.getActiveBots();
    var allBots = botManager.getAllBots();
    res.json({
        success: true,
        data: {
            name: 'AI Trading Bot API',
            version: '1.0.0',
            description: 'AI-powered trading bot platform using OpenAI o3-mini and NEAR Intents',
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
                nearIntents: 'Cross-chain swap execution',
                vercel: 'Serverless bot deployment'
            }
        }
    });
});
// Example bot creation endpoint for testing
app.post('/api/example-bot', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var exampleBot;
    return __generator(this, function (_a) {
        try {
            exampleBot = {
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
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create example bot'
            });
        }
        return [2 /*return*/];
    });
}); });
// 404 handler
app.use('*', function (req, res) {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: 'Visit /api/info for available endpoints'
    });
});
// Error handler
app.use(function (error, req, res, next) {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});
// Start server
var server = app.listen(PORT, function () {
    console.log("\uD83D\uDE80 Trading Bot API Server started on port ".concat(PORT));
    console.log("\uD83D\uDCCA Health check: http://localhost:".concat(PORT, "/api/health"));
    console.log("\uD83D\uDCD6 API info: http://localhost:".concat(PORT, "/api/info"));
    console.log("\uD83E\uDD16 Create bot: POST http://localhost:".concat(PORT, "/api/bots"));
    console.log("\uD83C\uDF10 Network: ".concat(process.env.IS_TESTNET === 'true' ? 'testnet' : 'mainnet'));
});
// Graceful shutdown
process.on('SIGTERM', function () {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    // Deactivate all bots
    var activeBots = botManager.getActiveBots();
    Promise.all(activeBots.map(function (bot) { return botManager.deactivateBot(bot.id); }))
        .then(function () {
        console.log('✅ All bots deactivated');
        server.close(function () {
            console.log('🔌 Server closed');
            process.exit(0);
        });
    })
        .catch(function (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    });
});
process.on('SIGINT', function () {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.emit('SIGTERM');
});
exports.default = app;
