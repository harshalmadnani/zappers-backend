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
exports.HyperliquidWebSocketService = void 0;
var ws_1 = require("ws");
var events_1 = require("events");
var HyperliquidWebSocketService = /** @class */ (function (_super) {
    __extends(HyperliquidWebSocketService, _super);
    function HyperliquidWebSocketService(targetCoin, isTestnet) {
        if (targetCoin === void 0) { targetCoin = 'SOL'; }
        if (isTestnet === void 0) { isTestnet = false; }
        var _this = _super.call(this) || this;
        _this.ws = null;
        _this.subscriptionId = null;
        _this.reconnectAttempts = 0;
        _this.maxReconnectAttempts = 5;
        _this.reconnectInterval = 5000;
        _this.isConnecting = false;
        _this.targetCoin = targetCoin;
        _this.isTestnet = isTestnet;
        return _this;
    }
    HyperliquidWebSocketService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var wsUrl;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.isConnecting || (this.ws && this.ws.readyState === ws_1.default.OPEN)) {
                    return [2 /*return*/];
                }
                this.isConnecting = true;
                try {
                    wsUrl = this.isTestnet
                        ? 'wss://api.hyperliquid-testnet.xyz/ws'
                        : 'wss://api.hyperliquid.xyz/ws';
                    this.ws = new ws_1.default(wsUrl);
                    this.ws.on('open', function () {
                        console.log("\uD83D\uDD17 Connected to Hyperliquid WebSocket (".concat(_this.isTestnet ? 'testnet' : 'mainnet', ")"));
                        _this.isConnecting = false;
                        _this.reconnectAttempts = 0;
                        _this.subscribe();
                        _this.emit('connected');
                    });
                    this.ws.on('message', function (data) {
                        try {
                            var message = JSON.parse(data.toString());
                            _this.handleMessage(message);
                        }
                        catch (error) {
                            console.error('Failed to parse WebSocket message:', error);
                        }
                    });
                    this.ws.on('close', function () {
                        console.log('🔌 Hyperliquid WebSocket connection closed');
                        _this.isConnecting = false;
                        _this.emit('disconnected');
                        _this.attemptReconnect();
                    });
                    this.ws.on('error', function (error) {
                        console.error('📡 Hyperliquid WebSocket error:', error);
                        _this.isConnecting = false;
                        _this.emit('error', error);
                    });
                }
                catch (error) {
                    this.isConnecting = false;
                    console.error('Failed to create WebSocket connection:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    HyperliquidWebSocketService.prototype.subscribe = function () {
        if (!this.ws || this.ws.readyState !== ws_1.default.OPEN) {
            console.error('Cannot subscribe - WebSocket not connected');
            return;
        }
        var subscriptionMessage = {
            method: 'subscribe',
            subscription: {
                type: 'trades',
                coin: this.targetCoin
            }
        };
        console.log("\uD83D\uDCE1 Subscribing to Hyperliquid trades for ".concat(this.targetCoin, "..."));
        this.ws.send(JSON.stringify(subscriptionMessage));
    };
    HyperliquidWebSocketService.prototype.handleMessage = function (message) {
        var _this = this;
        if (message.channel === 'subscriptionResponse') {
            // Subscription confirmation
            console.log("\u2705 Subscription confirmed for ".concat(this.targetCoin));
            this.emit('subscribed', message.data);
        }
        else if (message.channel === 'trades') {
            // Trade data updates
            var tradeData = message.data;
            tradeData.forEach(function (trade) {
                if (_this.isValidTradeData(trade)) {
                    var tokenData = {
                        timestamp: trade.time,
                        price: parseFloat(trade.px),
                        marketDepthUSDUp: 0, // Not available in Hyperliquid trades
                        marketDepthUSDDown: 0, // Not available in Hyperliquid trades
                        volume24h: parseFloat(trade.sz),
                        baseSymbol: trade.coin,
                        quoteSymbol: 'USD'
                    };
                    console.log("\uD83D\uDCB0 Trade Update: ".concat(tokenData.baseSymbol, "/USD = $").concat(tokenData.price, " (Size: ").concat(trade.sz, ")"));
                    _this.emit('priceUpdate', tokenData);
                }
            });
        }
        else {
            console.log('📨 Received message:', message);
        }
    };
    HyperliquidWebSocketService.prototype.isValidTradeData = function (data) {
        return (data &&
            typeof data.time === 'number' &&
            typeof data.px === 'string' &&
            typeof data.sz === 'string' &&
            typeof data.coin === 'string');
    };
    HyperliquidWebSocketService.prototype.attemptReconnect = function () {
        var _this = this;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("\u274C Max reconnection attempts (".concat(this.maxReconnectAttempts, ") reached"));
            this.emit('maxReconnectAttemptsReached');
            return;
        }
        this.reconnectAttempts++;
        console.log("\uD83D\uDD04 Attempting to reconnect (".concat(this.reconnectAttempts, "/").concat(this.maxReconnectAttempts, ")..."));
        setTimeout(function () {
            if (!_this.ws || _this.ws.readyState === ws_1.default.CLOSED) {
                _this.connect().catch(function (error) {
                    console.error('Reconnection failed:', error);
                });
            }
        }, this.reconnectInterval);
    };
    HyperliquidWebSocketService.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var unsubscribeMessage;
            return __generator(this, function (_a) {
                if (this.ws && this.ws.readyState === ws_1.default.OPEN) {
                    unsubscribeMessage = {
                        method: 'unsubscribe',
                        subscription: {
                            type: 'trades',
                            coin: this.targetCoin
                        }
                    };
                    this.ws.send(JSON.stringify(unsubscribeMessage));
                }
                if (this.ws) {
                    this.ws.close();
                    this.ws = null;
                }
                this.subscriptionId = null;
                this.reconnectAttempts = 0;
                console.log('🔌 Disconnected from Hyperliquid WebSocket');
                return [2 /*return*/];
            });
        });
    };
    HyperliquidWebSocketService.prototype.isConnected = function () {
        var _a;
        return ((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === ws_1.default.OPEN;
    };
    HyperliquidWebSocketService.prototype.getConnectionStatus = function () {
        if (!this.ws)
            return 'not_initialized';
        switch (this.ws.readyState) {
            case ws_1.default.CONNECTING:
                return 'connecting';
            case ws_1.default.OPEN:
                return 'connected';
            case ws_1.default.CLOSING:
                return 'closing';
            case ws_1.default.CLOSED:
                return 'closed';
            default:
                return 'unknown';
        }
    };
    // Method to get historical price data if needed
    HyperliquidWebSocketService.prototype.getHistoricalData = function () {
        return __awaiter(this, arguments, void 0, function (timeframe, limit) {
            if (timeframe === void 0) { timeframe = '1h'; }
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                // Hyperliquid has REST API endpoints for historical data
                // For now, return empty array as this is primarily a WebSocket service
                console.log("\uD83D\uDCCA Historical data requested for ".concat(this.targetCoin, ", ").concat(timeframe, " timeframe, ").concat(limit, " points"));
                return [2 /*return*/, []];
            });
        });
    };
    // Method to change subscription to different coin
    HyperliquidWebSocketService.prototype.updateSubscription = function (newCoin) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected()) {
                            throw new Error('Not connected to WebSocket');
                        }
                        // Unsubscribe from current subscription
                        return [4 /*yield*/, this.unsubscribe()];
                    case 1:
                        // Unsubscribe from current subscription
                        _a.sent();
                        // Update target coin and subscribe
                        this.targetCoin = newCoin;
                        this.subscribe();
                        return [2 /*return*/];
                }
            });
        });
    };
    HyperliquidWebSocketService.prototype.unsubscribe = function () {
        return __awaiter(this, void 0, void 0, function () {
            var unsubscribeMessage;
            return __generator(this, function (_a) {
                if (!this.isConnected()) {
                    return [2 /*return*/];
                }
                unsubscribeMessage = {
                    method: 'unsubscribe',
                    subscription: {
                        type: 'trades',
                        coin: this.targetCoin
                    }
                };
                this.ws.send(JSON.stringify(unsubscribeMessage));
                return [2 /*return*/];
            });
        });
    };
    // Method to subscribe to multiple coins
    HyperliquidWebSocketService.prototype.subscribeToMultipleCoins = function (coins) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, coins_1, coin, subscriptionMessage;
            return __generator(this, function (_a) {
                if (!this.isConnected()) {
                    throw new Error('Not connected to WebSocket');
                }
                for (_i = 0, coins_1 = coins; _i < coins_1.length; _i++) {
                    coin = coins_1[_i];
                    subscriptionMessage = {
                        method: 'subscribe',
                        subscription: {
                            type: 'trades',
                            coin: coin
                        }
                    };
                    console.log("\uD83D\uDCE1 Subscribing to ".concat(coin, " trades..."));
                    this.ws.send(JSON.stringify(subscriptionMessage));
                }
                return [2 /*return*/];
            });
        });
    };
    return HyperliquidWebSocketService;
}(events_1.EventEmitter));
exports.HyperliquidWebSocketService = HyperliquidWebSocketService;
