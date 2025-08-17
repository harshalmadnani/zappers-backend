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
exports.VercelDeployService = void 0;
var axios_1 = require("axios");
var VercelDeployService = /** @class */ (function () {
    function VercelDeployService(token, teamId) {
        this.token = token;
        this.teamId = teamId;
    }
    VercelDeployService.prototype.deployBot = function (botId_1, botName_1, generatedCode_1) {
        return __awaiter(this, arguments, void 0, function (botId, botName, generatedCode, environmentVariables) {
            var deploymentData, headers, response, deployment, error_1, errorMessage;
            var _a, _b, _c;
            if (environmentVariables === void 0) { environmentVariables = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDE80 Deploying bot \"".concat(botName, "\" to Vercel..."));
                        deploymentData = {
                            name: "trading-bot-".concat(botId),
                            files: [
                                {
                                    file: 'api/bot.ts',
                                    data: generatedCode
                                },
                                {
                                    file: 'package.json',
                                    data: JSON.stringify({
                                        name: "trading-bot-".concat(botId),
                                        version: '1.0.0',
                                        dependencies: {
                                            'ws': '^8.15.1',
                                            'axios': '^1.6.2'
                                        }
                                    }, null, 2)
                                },
                                {
                                    file: 'vercel.json',
                                    data: JSON.stringify({
                                        functions: {
                                            'api/bot.ts': {
                                                runtime: '@vercel/node'
                                            }
                                        },
                                        env: environmentVariables
                                    }, null, 2)
                                }
                            ],
                            projectSettings: {
                                framework: null,
                                buildCommand: null,
                                outputDirectory: null,
                                installCommand: null,
                                devCommand: null
                            },
                            target: 'production'
                        };
                        headers = {
                            'Authorization': "Bearer ".concat(this.token),
                            'Content-Type': 'application/json'
                        };
                        if (this.teamId) {
                            headers['X-Vercel-Team-Id'] = this.teamId;
                        }
                        return [4 /*yield*/, axios_1.default.post('https://api.vercel.com/v13/deployments', deploymentData, {
                                headers: headers,
                                timeout: 60000 // 60 seconds
                            })];
                    case 1:
                        response = _d.sent();
                        deployment = response.data;
                        console.log("\u2705 Bot deployed successfully! URL: https://".concat(deployment.url));
                        return [2 /*return*/, {
                                id: deployment.id,
                                url: "https://".concat(deployment.url),
                                name: deployment.name,
                                status: deployment.readyState || 'BUILDING',
                                createdAt: Date.now()
                            }];
                    case 2:
                        error_1 = _d.sent();
                        console.error('❌ Vercel deployment failed:', error_1);
                        if (axios_1.default.isAxiosError(error_1)) {
                            errorMessage = ((_c = (_b = (_a = error_1.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) === null || _c === void 0 ? void 0 : _c.message) || error_1.message;
                            throw new Error("Vercel deployment failed: ".concat(errorMessage));
                        }
                        throw new Error("Vercel deployment failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    VercelDeployService.prototype.getDeploymentStatus = function (deploymentId) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, response, deployment, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        headers = {
                            'Authorization': "Bearer ".concat(this.token)
                        };
                        if (this.teamId) {
                            headers['X-Vercel-Team-Id'] = this.teamId;
                        }
                        return [4 /*yield*/, axios_1.default.get("https://api.vercel.com/v13/deployments/".concat(deploymentId), { headers: headers })];
                    case 1:
                        response = _a.sent();
                        deployment = response.data;
                        return [2 /*return*/, {
                                id: deployment.id,
                                url: "https://".concat(deployment.url),
                                name: deployment.name,
                                status: deployment.readyState,
                                createdAt: deployment.createdAt
                            }];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error fetching deployment status:', error_2);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    VercelDeployService.prototype.deleteDeployment = function (deploymentId) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        headers = {
                            'Authorization': "Bearer ".concat(this.token)
                        };
                        if (this.teamId) {
                            headers['X-Vercel-Team-Id'] = this.teamId;
                        }
                        return [4 /*yield*/, axios_1.default.delete("https://api.vercel.com/v13/deployments/".concat(deploymentId), { headers: headers })];
                    case 1:
                        _a.sent();
                        console.log("\uD83D\uDDD1\uFE0F Deployment ".concat(deploymentId, " deleted successfully"));
                        return [2 /*return*/, true];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error deleting deployment:', error_3);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    VercelDeployService.prototype.listDeployments = function (projectName) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, url, response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        headers = {
                            'Authorization': "Bearer ".concat(this.token)
                        };
                        if (this.teamId) {
                            headers['X-Vercel-Team-Id'] = this.teamId;
                        }
                        url = 'https://api.vercel.com/v6/deployments';
                        if (projectName) {
                            url += "?projectId=".concat(projectName);
                        }
                        return [4 /*yield*/, axios_1.default.get(url, { headers: headers })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data.deployments.map(function (deployment) { return ({
                                id: deployment.id,
                                url: "https://".concat(deployment.url),
                                name: deployment.name,
                                status: deployment.readyState,
                                createdAt: deployment.createdAt
                            }); })];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error listing deployments:', error_4);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Helper method to generate environment variables for the bot
    VercelDeployService.prototype.generateBotEnvironmentVariables = function (openaiApiKey, placeholder, // Not used for Hyperliquid
    nearIntentsApiUrl, targetCoin, swapConfig) {
        return {
            OPENAI_API_KEY: openaiApiKey,
            NEAR_INTENTS_API_URL: nearIntentsApiUrl,
            TARGET_COIN: targetCoin,
            IS_TESTNET: 'false',
            SWAP_CONFIG: JSON.stringify(swapConfig),
            NODE_ENV: 'production'
        };
    };
    // Method to check if Vercel token is valid
    VercelDeployService.prototype.validateToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var headers, response, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        headers = {
                            'Authorization': "Bearer ".concat(this.token)
                        };
                        if (this.teamId) {
                            headers['X-Vercel-Team-Id'] = this.teamId;
                        }
                        return [4 /*yield*/, axios_1.default.get('https://api.vercel.com/v2/user', { headers: headers })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.status === 200];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Vercel token validation failed:', error_5);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return VercelDeployService;
}());
exports.VercelDeployService = VercelDeployService;
