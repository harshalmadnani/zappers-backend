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
exports.createBotsRouter = createBotsRouter;
var express_1 = require("express");
function createBotsRouter(botManager) {
    var _this = this;
    var router = (0, express_1.Router)();
    // Create a new trading bot
    router.post('/', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var botRequest, bot, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    botRequest = req.body;
                    // Validate required fields
                    if (!botRequest.name || !botRequest.prompt || !botRequest.swapConfig) {
                        return [2 /*return*/, res.status(400).json({
                                success: false,
                                error: 'Missing required fields: name, prompt, and swapConfig are required'
                            })];
                    }
                    return [4 /*yield*/, botManager.createBot(botRequest)];
                case 1:
                    bot = _a.sent();
                    res.status(201).json({
                        success: true,
                        data: bot,
                        message: 'Trading bot created successfully'
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error creating bot:', error_1);
                    res.status(500).json({
                        success: false,
                        error: error_1 instanceof Error ? error_1.message : 'Failed to create bot'
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Get all bots
    router.get('/', function (req, res) {
        try {
            var bots = botManager.getAllBots();
            res.json({
                success: true,
                data: bots
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch bots'
            });
        }
    });
    // Get specific bot
    router.get('/:botId', function (req, res) {
        try {
            var botId = req.params.botId;
            var bot = botManager.getBot(botId);
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
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch bot'
            });
        }
    });
    // Activate a bot
    router.post('/:botId/activate', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var botId, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    botId = req.params.botId;
                    return [4 /*yield*/, botManager.activateBot(botId)];
                case 1:
                    _a.sent();
                    res.json({
                        success: true,
                        message: 'Bot activated successfully'
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error activating bot:', error_2);
                    res.status(500).json({
                        success: false,
                        error: error_2 instanceof Error ? error_2.message : 'Failed to activate bot'
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Deactivate a bot
    router.post('/:botId/deactivate', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var botId, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    botId = req.params.botId;
                    return [4 /*yield*/, botManager.deactivateBot(botId)];
                case 1:
                    _a.sent();
                    res.json({
                        success: true,
                        message: 'Bot deactivated successfully'
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Error deactivating bot:', error_3);
                    res.status(500).json({
                        success: false,
                        error: error_3 instanceof Error ? error_3.message : 'Failed to deactivate bot'
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Delete a bot
    router.delete('/:botId', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var botId, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    botId = req.params.botId;
                    return [4 /*yield*/, botManager.deleteBot(botId)];
                case 1:
                    _a.sent();
                    res.json({
                        success: true,
                        message: 'Bot deleted successfully'
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _a.sent();
                    console.error('Error deleting bot:', error_4);
                    res.status(500).json({
                        success: false,
                        error: error_4 instanceof Error ? error_4.message : 'Failed to delete bot'
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Get bot execution logs
    router.get('/:botId/logs', function (req, res) {
        try {
            var botId = req.params.botId;
            var logs = botManager.getBotLogs(botId);
            res.json({
                success: true,
                data: logs
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch bot logs'
            });
        }
    });
    // Optimize bot strategy
    router.post('/:botId/optimize', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var botId, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    botId = req.params.botId;
                    return [4 /*yield*/, botManager.optimizeBot(botId)];
                case 1:
                    _a.sent();
                    res.json({
                        success: true,
                        message: 'Bot strategy optimized successfully'
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error('Error optimizing bot:', error_5);
                    res.status(500).json({
                        success: false,
                        error: error_5 instanceof Error ? error_5.message : 'Failed to optimize bot'
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Get active bots
    router.get('/status/active', function (req, res) {
        try {
            var activeBots = botManager.getActiveBots();
            res.json({
                success: true,
                data: activeBots,
                message: "".concat(activeBots.length, " active bots")
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch active bots'
            });
        }
    });
    // Get price history
    router.get('/market/price-history', function (req, res) {
        try {
            var priceHistory = botManager.getPriceHistory();
            var limit = parseInt(req.query.limit) || 100;
            res.json({
                success: true,
                data: priceHistory.slice(-limit),
                message: "Last ".concat(Math.min(limit, priceHistory.length), " price points")
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch price history'
            });
        }
    });
    return router;
}
