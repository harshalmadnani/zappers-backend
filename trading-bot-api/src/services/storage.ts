import * as fs from 'fs';
import * as path from 'path';
import { TradingBot, BotExecutionLog } from '../types';

export class StorageService {
  private botsFilePath: string;
  private logsFilePath: string;
  private dataDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.botsFilePath = path.join(dataDir, 'bots.json');
    this.logsFilePath = path.join(dataDir, 'execution-logs.json');
    
    // Ensure data directory exists
    this.ensureDataDirectory();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  // Bot storage methods
  async saveBots(bots: Map<string, TradingBot>): Promise<void> {
    try {
      const botsArray = Array.from(bots.entries()).map(([id, bot]) => ({
        ...bot,
        id, // Keep the id after spreading bot properties
        // Convert Date objects to ISO strings for JSON serialization
        createdAt: bot.createdAt.toISOString(),
        lastExecution: bot.lastExecution?.toISOString()
      }));

      await fs.promises.writeFile(
        this.botsFilePath, 
        JSON.stringify(botsArray, null, 2),
        'utf8'
      );
      console.log(`💾 Saved ${botsArray.length} bots to storage`);
    } catch (error) {
      console.error('❌ Failed to save bots:', error);
      throw error;
    }
  }

  async loadBots(): Promise<Map<string, TradingBot>> {
    try {
      if (!fs.existsSync(this.botsFilePath)) {
        console.log('📂 No existing bots file found, starting with empty storage');
        return new Map();
      }

      const data = await fs.promises.readFile(this.botsFilePath, 'utf8');
      const botsArray = JSON.parse(data);
      
      const bots = new Map<string, TradingBot>();
      
      for (const botData of botsArray) {
        const bot: TradingBot = {
          ...botData,
          // Convert ISO strings back to Date objects
          createdAt: new Date(botData.createdAt),
          lastExecution: botData.lastExecution ? new Date(botData.lastExecution) : undefined
        };
        bots.set(botData.id, bot);
      }

      console.log(`📥 Loaded ${bots.size} bots from storage`);
      return bots;
    } catch (error) {
      console.error('❌ Failed to load bots:', error);
      return new Map();
    }
  }

  // Execution logs storage methods
  async saveExecutionLogs(logs: Map<string, BotExecutionLog[]>): Promise<void> {
    try {
      const logsArray = Array.from(logs.entries()).map(([botId, botLogs]) => ({
        botId,
        logs: botLogs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString()
        }))
      }));

      await fs.promises.writeFile(
        this.logsFilePath,
        JSON.stringify(logsArray, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('❌ Failed to save execution logs:', error);
      throw error;
    }
  }

  async loadExecutionLogs(): Promise<Map<string, BotExecutionLog[]>> {
    try {
      if (!fs.existsSync(this.logsFilePath)) {
        console.log('📂 No existing logs file found, starting with empty logs');
        return new Map();
      }

      const data = await fs.promises.readFile(this.logsFilePath, 'utf8');
      const logsArray = JSON.parse(data);
      
      const logs = new Map<string, BotExecutionLog[]>();
      
      for (const logData of logsArray) {
        const botLogs = logData.logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
        logs.set(logData.botId, botLogs);
      }

      console.log(`📥 Loaded execution logs for ${logs.size} bots from storage`);
      return logs;
    } catch (error) {
      console.error('❌ Failed to load execution logs:', error);
      return new Map();
    }
  }

  // Individual bot operations
  async saveBot(bot: TradingBot): Promise<void> {
    const bots = await this.loadBots();
    bots.set(bot.id, bot);
    await this.saveBots(bots);
  }

  async deleteBot(botId: string): Promise<void> {
    const bots = await this.loadBots();
    const logs = await this.loadExecutionLogs();
    
    bots.delete(botId);
    logs.delete(botId);
    
    await this.saveBots(bots);
    await this.saveExecutionLogs(logs);
  }

  // Log individual execution
  async logExecution(botId: string, executionLog: BotExecutionLog): Promise<void> {
    const logs = await this.loadExecutionLogs();
    const botLogs = logs.get(botId) || [];
    
    botLogs.push(executionLog);
    logs.set(botId, botLogs);
    
    await this.saveExecutionLogs(logs);
  }
}
