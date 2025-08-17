"use strict";
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
exports.OpenAIService = void 0;
var openai_1 = require("openai");
var OpenAIService = /** @class */ (function () {
    function OpenAIService(apiKey) {
        this.client = new openai_1.default({
            apiKey: apiKey,
        });
    }
    OpenAIService.prototype.generateTradingBot = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response, parsed, codeMatch, code, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildBotGenerationPrompt(request);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.chat.completions.create({
                                model: "o3-mini", // Using GPT-4 as o3-mini might not be available yet
                                messages: [
                                    {
                                        role: "system",
                                        content: "You are an expert trading bot developer. Generate complete, production-ready TypeScript code for trading bots that:\n1. Listen to Hyperliquid WebSocket for real-time price data\n2. Execute cross-chain swaps using Relay Protocol (https://api.relay.link)\n3. Follow specific trading strategies based on user prompts\n4. Include proper error handling and logging\n5. Are deployable to Vercel as serverless functions\n\nUse Hyperliquid WebSocket API (wss://api.hyperliquid.xyz/ws) with this subscription format:\n{\n  \"method\": \"subscribe\",\n  \"subscription\": {\n    \"type\": \"trades\",\n    \"coin\": \"SOL\"\n  }\n}\n\nFor swaps, use Relay Protocol endpoints:\n- POST /quote - Get swap quote\n- Execute transactions using ethers.js with private keys\n- Monitor cross-chain transaction status\n\nReturn your response as a JSON object with:\n- code: Complete TypeScript code for a Vercel API route\n- strategy: Trading strategy object with type and parameters\n- explanation: Brief explanation of the bot's logic\n\nThe code should be a complete Vercel API route that can be deployed immediately."
                                    },
                                    {
                                        role: "user",
                                        content: prompt
                                    }
                                ],
                            })];
                    case 2:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            throw new Error('No response from OpenAI');
                        }
                        // Try to parse JSON response
                        try {
                            parsed = JSON.parse(response);
                            return [2 /*return*/, {
                                    code: parsed.code,
                                    strategy: parsed.strategy,
                                    explanation: parsed.explanation
                                }];
                        }
                        catch (parseError) {
                            codeMatch = response.match(/```(?:typescript|ts)?\n([\s\S]*?)\n```/);
                            code = codeMatch ? codeMatch[1] : response;
                            return [2 /*return*/, {
                                    code: code,
                                    strategy: this.extractStrategyFromPrompt(request),
                                    explanation: 'Generated trading bot based on user requirements'
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        console.error('OpenAI API error:', error_1);
                        throw new Error("Failed to generate trading bot: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OpenAIService.prototype.buildBotGenerationPrompt = function (request) {
        var name = request.name, prompt = request.prompt, swapConfig = request.swapConfig, strategy = request.strategy;
        return "Create a trading bot with the following requirements:\n\nBot Name: ".concat(name, "\nUser Prompt: ").concat(prompt, "\n\nSwap Configuration:\n- Origin: ").concat(swapConfig.amount, " ").concat(swapConfig.originSymbol, " on ").concat(swapConfig.originBlockchain, "\n- Destination: ").concat(swapConfig.destinationSymbol, " on ").concat(swapConfig.destinationBlockchain, "\n- Sender: ").concat(swapConfig.senderAddress, "\n- Recipient: ").concat(swapConfig.recipientAddress, "\n\nTarget Coin for Hyperliquid WebSocket: ").concat(request.targetCoin || 'SOL', "\n\nRequired Features:\n1. Connect to Hyperliquid WebSocket at wss://api.hyperliquid.xyz/ws\n2. Monitor real-time trade data for the target coin\n3. Implement trading logic based on the user prompt\n4. Execute cross-chain swaps via Relay Protocol at https://api.relay.link\n5. Include proper error handling and logging\n6. Store execution history\n7. Support price thresholds, intervals, and custom conditions\n\nThe code should be a complete Vercel API route that:\n- Exports a default handler function\n- Handles GET requests for status and POST requests for manual execution\n- Manages WebSocket connections efficiently\n- Includes environment variable configuration\n- Has proper TypeScript types\n- Uses Relay Protocol for cross-chain swaps with proper chain ID mapping\n- Supports multiple blockchains (Ethereum, Polygon, Base, Arbitrum, etc.)\n\nMake the bot intelligent and responsive to the user's trading strategy described in their prompt.");
    };
    OpenAIService.prototype.extractStrategyFromPrompt = function (request) {
        var prompt = request.prompt, strategy = request.strategy;
        // Simple strategy extraction based on keywords
        var type = 'custom';
        var parameters = {};
        if (prompt.toLowerCase().includes('price above') || prompt.toLowerCase().includes('price below')) {
            type = 'price_threshold';
            var priceMatch = prompt.match(/(\d+(?:\.\d+)?)/);
            if (priceMatch) {
                if (prompt.toLowerCase().includes('above')) {
                    parameters.buyThreshold = parseFloat(priceMatch[1]);
                }
                else {
                    parameters.sellThreshold = parseFloat(priceMatch[1]);
                }
            }
        }
        else if (prompt.toLowerCase().includes('between') || prompt.toLowerCase().includes('range')) {
            type = 'price_range';
            var priceMatches = prompt.match(/(\d+(?:\.\d+)?)/g);
            if (priceMatches && priceMatches.length >= 2) {
                parameters.minPrice = parseFloat(priceMatches[0]);
                parameters.maxPrice = parseFloat(priceMatches[1]);
            }
        }
        else if (prompt.toLowerCase().includes('every') || prompt.toLowerCase().includes('interval')) {
            type = 'interval';
            var intervalMatch = prompt.match(/(\d+)\s*(minute|hour|second)/i);
            if (intervalMatch) {
                var value = parseInt(intervalMatch[1]);
                var unit = intervalMatch[2].toLowerCase();
                var milliseconds = value;
                if (unit === 'minute')
                    milliseconds *= 60 * 1000;
                else if (unit === 'hour')
                    milliseconds *= 60 * 60 * 1000;
                else if (unit === 'second')
                    milliseconds *= 1000;
                parameters.interval = milliseconds;
            }
        }
        return {
            id: "strategy-".concat(Date.now()),
            name: "Strategy for ".concat(request.name),
            description: prompt,
            type: type,
            parameters: __assign(__assign({}, parameters), strategy === null || strategy === void 0 ? void 0 : strategy.parameters)
        };
    };
    OpenAIService.prototype.optimizeStrategy = function (currentStrategy, executionHistory, marketData) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = "Analyze the trading performance and optimize the strategy:\n\nCurrent Strategy: ".concat(JSON.stringify(currentStrategy, null, 2), "\nExecution History: ").concat(JSON.stringify(executionHistory.slice(-10), null, 2), "\nRecent Market Data: ").concat(JSON.stringify(marketData.slice(-20), null, 2), "\n\nProvide an optimized strategy that improves performance based on the historical data and market patterns.\nReturn as JSON with the same structure as the current strategy.");
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.chat.completions.create({
                                model: "o3-mini",
                                messages: [
                                    {
                                        role: "system",
                                        content: "You are a quantitative trading analyst. Analyze trading performance and optimize strategies based on historical data and market patterns."
                                    },
                                    {
                                        role: "user",
                                        content: prompt
                                    }
                                ],
                            })];
                    case 2:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            throw new Error('No response from OpenAI for strategy optimization');
                        }
                        try {
                            return [2 /*return*/, JSON.parse(response)];
                        }
                        catch (_d) {
                            // If parsing fails, return current strategy
                            return [2 /*return*/, currentStrategy];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _c.sent();
                        console.error('Strategy optimization error:', error_2);
                        return [2 /*return*/, currentStrategy];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return OpenAIService;
}());
exports.OpenAIService = OpenAIService;
