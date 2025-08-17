"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.BotManager = void 0;
var uuid_1 = require("uuid");
var events_1 = require("events");
var openai_1 = require("./openai");
var hyperliquid_1 = require("./hyperliquid");
var relay_1 = require("./relay");
var vercel_deploy_1 = require("./vercel-deploy");
var BotManager = /** @class */ (function (_super) {
    __extends(BotManager, _super);
    function BotManager(openaiApiKey, vercelToken, relayApiKey, targetCoin, isTestnet) {
        if (targetCoin === void 0) { targetCoin = 'SOL'; }
        if (isTestnet === void 0) { isTestnet = false; }
        var _this = _super.call(this) || this;
        _this.bots = new Map();
        _this.executionLogs = new Map();
        _this.priceHistory = [];
        _this.activeConnections = new Map();
        _this.openaiService = new openai_1.OpenAIService(openaiApiKey);
        _this.relayService = new relay_1.RelayService('https://api.relay.link', relayApiKey);
        _this.vercelService = new vercel_deploy_1.VercelDeployService(vercelToken);
        _this.targetCoin = targetCoin;
        _this.isTestnet = isTestnet;
        return _this;
    }
    BotManager.prototype.createBot = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var targetCoin, validationErrors, generatedBot, bot, environmentVariables, deployment, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("\uD83E\uDD16 Creating trading bot: ".concat(request.name));
                        targetCoin = request.targetCoin || 'SOL';
                        console.log("\uD83C\uDFAF Target coin: ".concat(targetCoin));
                        validationErrors = this.relayService.validateSwapRequest(request.swapConfig);
                        if (validationErrors.length > 0) {
                            throw new Error("Invalid swap configuration: ".concat(validationErrors.join(', ')));
                        }
                        return [4 /*yield*/, this.openaiService.generateTradingBot(request)];
                    case 1:
                        generatedBot = _a.sent();
                        bot = {
                            id: (0, uuid_1.v4)(),
                            name: request.name,
                            strategy: __assign(__assign({}, generatedBot.strategy), { parameters: __assign(__assign({}, generatedBot.strategy.parameters), { targetCoin: targetCoin }) }),
                            swapConfig: request.swapConfig,
                            isActive: false,
                            createdAt: new Date(),
                            executionCount: 0,
                            generatedCode: generatedBot.code
                        };
                        environmentVariables = this.vercelService.generateBotEnvironmentVariables(process.env.OPENAI_API_KEY || '', '', // No API key needed for Hyperliquid
                        'https://api.relay.link', // Relay API URL
                        targetCoin, // Use the targetCoin from request
                        request.swapConfig);
                        return [4 /*yield*/, this.vercelService.deployBot(bot.id, bot.name, bot.generatedCode, environmentVariables)];
                    case 2:
                        deployment = _a.sent();
                        bot.vercelDeploymentUrl = deployment.url;
                        // Store bot
                        this.bots.set(bot.id, bot);
                        this.executionLogs.set(bot.id, []);
                        console.log("\u2705 Bot \"".concat(bot.name, "\" created successfully!"));
                        console.log("\uD83D\uDD17 Deployment URL: ".concat(bot.vercelDeploymentUrl));
                        this.emit('botCreated', bot);
                        return [2 /*return*/, bot];
                    case 3:
                        error_1 = _a.sent();
                        console.error('❌ Failed to create bot:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BotManager.prototype.activateBot = function (botId) {
        return __awaiter(this, void 0, void 0, function () {
            var bot, botTargetCoin, wsService, error_2;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        bot = this.bots.get(botId);
                        if (!bot) {
                            throw new Error("Bot ".concat(botId, " not found"));
                        }
                        if (bot.isActive) {
                            console.log("Bot ".concat(bot.name, " is already active"));
                            return [2 /*return*/];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        botTargetCoin = ((_b = (_a = bot.strategy) === null || _a === void 0 ? void 0 : _a.parameters) === null || _b === void 0 ? void 0 : _b.targetCoin) || this.targetCoin;
                        wsService = new hyperliquid_1.HyperliquidWebSocketService(botTargetCoin, this.isTestnet);
                        // Set up price monitoring
                        wsService.on('priceUpdate', function (priceData) {
                            _this.handlePriceUpdate(bot, priceData);
                        });
                        wsService.on('connected', function () {
                            console.log("\uD83D\uDCE1 Hyperliquid WebSocket connected for bot: ".concat(bot.name));
                        });
                        wsService.on('error', function (error) {
                            console.error("Hyperliquid WebSocket error for bot ".concat(bot.name, ":"), error);
                            _this.logExecution(bot.id, 'hold', 0, undefined, undefined, false, "WebSocket error: ".concat(error.message));
                        });
                        // Connect to WebSocket
                        return [4 /*yield*/, wsService.connect()];
                    case 2:
                        // Connect to WebSocket
                        _c.sent();
                        this.activeConnections.set(botId, wsService);
                        // Mark bot as active
                        bot.isActive = true;
                        bot.lastExecution = new Date();
                        console.log("\uD83D\uDE80 Bot \"".concat(bot.name, "\" activated successfully"));
                        this.emit('botActivated', bot);
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _c.sent();
                        console.error("Failed to activate bot ".concat(bot.name, ":"), error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BotManager.prototype.deactivateBot = function (botId) {
        return __awaiter(this, void 0, void 0, function () {
            var bot, wsService;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bot = this.bots.get(botId);
                        if (!bot) {
                            throw new Error("Bot ".concat(botId, " not found"));
                        }
                        if (!bot.isActive) {
                            console.log("Bot ".concat(bot.name, " is already inactive"));
                            return [2 /*return*/];
                        }
                        wsService = this.activeConnections.get(botId);
                        if (!wsService) return [3 /*break*/, 2];
                        return [4 /*yield*/, wsService.disconnect()];
                    case 1:
                        _a.sent();
                        this.activeConnections.delete(botId);
                        _a.label = 2;
                    case 2:
                        // Mark bot as inactive
                        bot.isActive = false;
                        console.log("\u23F9\uFE0F Bot \"".concat(bot.name, "\" deactivated"));
                        this.emit('botDeactivated', bot);
                        return [2 /*return*/];
                }
            });
        });
    };
    BotManager.prototype.deleteBot = function (botId) {
        return __awaiter(this, void 0, void 0, function () {
            var bot, deploymentId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bot = this.bots.get(botId);
                        if (!bot) {
                            throw new Error("Bot ".concat(botId, " not found"));
                        }
                        if (!bot.isActive) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.deactivateBot(botId)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!bot.vercelDeploymentUrl) return [3 /*break*/, 4];
                        deploymentId = this.extractDeploymentId(bot.vercelDeploymentUrl);
                        if (!deploymentId) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.vercelService.deleteDeployment(deploymentId)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        // Remove from storage
                        this.bots.delete(botId);
                        this.executionLogs.delete(botId);
                        console.log("\uD83D\uDDD1\uFE0F Bot \"".concat(bot.name, "\" deleted"));
                        this.emit('botDeleted', botId);
                        return [2 /*return*/];
                }
            });
        });
    };
    BotManager.prototype.handlePriceUpdate = function (bot, priceData) {
        return __awaiter(this, void 0, void 0, function () {
            var shouldExecuteTrade, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        // Store price history
                        this.priceHistory.push(priceData);
                        // Keep only last 1000 price points
                        if (this.priceHistory.length > 1000) {
                            this.priceHistory = this.priceHistory.slice(-1000);
                        }
                        return [4 /*yield*/, this.evaluateStrategy(bot, priceData)];
                    case 1:
                        shouldExecuteTrade = _a.sent();
                        if (!(shouldExecuteTrade.execute && shouldExecuteTrade.action !== 'hold')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.executeTrade(bot, shouldExecuteTrade.action, priceData.price)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_3 = _a.sent();
                        console.error("Error handling price update for bot ".concat(bot.name, ":"), error_3);
                        this.logExecution(bot.id, 'hold', priceData.price, undefined, undefined, false, "Price handling error: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    BotManager.prototype.evaluateStrategy = function (bot, priceData) {
        return __awaiter(this, void 0, void 0, function () {
            var strategy, currentPrice, timeSinceLastExecution, recentPrices, avgPrice;
            return __generator(this, function (_a) {
                strategy = bot.strategy;
                currentPrice = priceData.price;
                switch (strategy.type) {
                    case 'price_threshold':
                        if (strategy.parameters.buyThreshold && currentPrice <= strategy.parameters.buyThreshold) {
                            return [2 /*return*/, { execute: true, action: 'buy' }];
                        }
                        if (strategy.parameters.sellThreshold && currentPrice >= strategy.parameters.sellThreshold) {
                            return [2 /*return*/, { execute: true, action: 'sell' }];
                        }
                        break;
                    case 'price_range':
                        if (strategy.parameters.minPrice && currentPrice <= strategy.parameters.minPrice) {
                            return [2 /*return*/, { execute: true, action: 'buy' }];
                        }
                        if (strategy.parameters.maxPrice && currentPrice >= strategy.parameters.maxPrice) {
                            return [2 /*return*/, { execute: true, action: 'sell' }];
                        }
                        break;
                    case 'interval':
                        timeSinceLastExecution = bot.lastExecution
                            ? Date.now() - bot.lastExecution.getTime()
                            : Infinity;
                        if (strategy.parameters.interval && timeSinceLastExecution >= strategy.parameters.interval) {
                            recentPrices = this.priceHistory.slice(-10).map(function (p) { return p.price; });
                            avgPrice = recentPrices.reduce(function (a, b) { return a + b; }, 0) / recentPrices.length;
                            return [2 /*return*/, {
                                    execute: true,
                                    action: currentPrice < avgPrice ? 'buy' : 'sell'
                                }];
                        }
                        break;
                    case 'custom':
                        // For custom strategies, we could use AI to evaluate
                        // This would require more complex logic
                        break;
                }
                return [2 /*return*/, { execute: false, action: 'hold' }];
            });
        });
    };
    BotManager.prototype.executeTrade = function (bot, action, currentPrice) {
        return __awaiter(this, void 0, void 0, function () {
            var swapRequest, result, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDCB1 Executing ".concat(action, " trade for bot: ").concat(bot.name, " at price: $").concat(currentPrice));
                        swapRequest = void 0;
                        if (action === 'buy') {
                            // Buy destination token (swap from origin to destination)
                            swapRequest = __assign({}, bot.swapConfig);
                        }
                        else {
                            // Sell destination token (swap from destination to origin)
                            swapRequest = __assign(__assign({}, bot.swapConfig), { originSymbol: bot.swapConfig.destinationSymbol, originBlockchain: bot.swapConfig.destinationBlockchain, destinationSymbol: bot.swapConfig.originSymbol, destinationBlockchain: bot.swapConfig.originBlockchain });
                        }
                        return [4 /*yield*/, this.relayService.executeSwap(swapRequest)];
                    case 1:
                        result = _b.sent();
                        // Update bot statistics
                        bot.executionCount++;
                        bot.lastExecution = new Date();
                        // Log execution
                        this.logExecution(bot.id, action, currentPrice, swapRequest.amount, ((_a = result.data) === null || _a === void 0 ? void 0 : _a.txHash) || result.txHash, result.success, result.error);
                        if (result.success) {
                            console.log("\u2705 ".concat(action, " trade executed successfully for bot: ").concat(bot.name));
                            this.emit('tradeExecuted', {
                                bot: bot,
                                action: action,
                                price: currentPrice,
                                result: result
                            });
                        }
                        else {
                            console.error("\u274C ".concat(action, " trade failed for bot: ").concat(bot.name, " - ").concat(result.error));
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _b.sent();
                        console.error("Trade execution error for bot ".concat(bot.name, ":"), error_4);
                        this.logExecution(bot.id, action, currentPrice, undefined, undefined, false, error_4 instanceof Error ? error_4.message : 'Unknown error');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    BotManager.prototype.logExecution = function (botId, action, price, amount, txHash, success, error) {
        if (success === void 0) { success = true; }
        var log = {
            botId: botId,
            timestamp: new Date(),
            action: action,
            price: price,
            amount: amount,
            txHash: txHash,
            success: success,
            error: error
        };
        var logs = this.executionLogs.get(botId) || [];
        logs.push(log);
        // Keep only last 100 logs per bot
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        this.executionLogs.set(botId, logs);
    };
    // Utility methods
    BotManager.prototype.getAllBots = function () {
        return Array.from(this.bots.values());
    };
    BotManager.prototype.getBot = function (botId) {
        return this.bots.get(botId);
    };
    BotManager.prototype.getBotLogs = function (botId) {
        return this.executionLogs.get(botId) || [];
    };
    BotManager.prototype.getPriceHistory = function () {
        return this.priceHistory.slice(); // Return copy
    };
    BotManager.prototype.getActiveBots = function () {
        return Array.from(this.bots.values()).filter(function (bot) { return bot.isActive; });
    };
    BotManager.prototype.extractDeploymentId = function (url) {
        // Extract deployment ID from Vercel URL
        var match = url.match(/https:\/\/([^.]+)\.vercel\.app/);
        return match ? match[1] : null;
    };
    BotManager.prototype.optimizeBot = function (botId) {
        return __awaiter(this, void 0, void 0, function () {
            var bot, logs, marketData, optimizedStrategy, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        bot = this.bots.get(botId);
                        if (!bot) {
                            throw new Error("Bot ".concat(botId, " not found"));
                        }
                        logs = this.getBotLogs(botId);
                        marketData = this.getPriceHistory().slice(-50);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.openaiService.optimizeStrategy(bot.strategy, logs, marketData)];
                    case 2:
                        optimizedStrategy = _a.sent();
                        bot.strategy = optimizedStrategy;
                        console.log("\uD83D\uDD27 Bot \"".concat(bot.name, "\" strategy optimized"));
                        this.emit('botOptimized', bot);
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        console.error("Failed to optimize bot ".concat(bot.name, ":"), error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return BotManager;
}(events_1.EventEmitter));
exports.BotManager = BotManager;
