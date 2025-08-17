import { Router, Request, Response } from 'express';
import { BotManager } from '../services/bot-manager';
import { BotCreationRequest, APIResponse } from '../types';

export function createBotsRouter(botManager: BotManager): Router {
  const router = Router();

  // Create a new trading bot
  router.post('/', async (req: Request, res: Response) => {
    try {
      const botRequest: BotCreationRequest = req.body;

      // Validate required fields
      if (!botRequest.name || !botRequest.prompt || !botRequest.swapConfig) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, prompt, and swapConfig are required'
        } as APIResponse);
      }

      // Log user wallet if provided
      if (botRequest.userWallet) {
        console.log(`👤 Creating bot for user wallet: ${botRequest.userWallet}`);
      }

      const bot = await botManager.createBot(botRequest);

      res.status(201).json({
        success: true,
        data: bot,
        message: 'Trading bot created successfully'
      } as APIResponse);

    } catch (error) {
      console.error('Error creating bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create bot'
      } as APIResponse);
    }
  });

  // Get all bots
  router.get('/', (req: Request, res: Response) => {
    try {
      const bots = botManager.getAllBots();
      res.json({
        success: true,
        data: bots
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bots'
      } as APIResponse);
    }
  });

  // Get specific bot
  router.get('/:botId', (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      const bot = botManager.getBot(botId);

      if (!bot) {
        return res.status(404).json({
          success: false,
          error: 'Bot not found'
        } as APIResponse);
      }

      res.json({
        success: true,
        data: bot
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bot'
      } as APIResponse);
    }
  });

  // Activate a bot
  router.post('/:botId/activate', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      await botManager.activateBot(botId);

      res.json({
        success: true,
        message: 'Bot activated successfully'
      } as APIResponse);

    } catch (error) {
      console.error('Error activating bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate bot'
      } as APIResponse);
    }
  });

  // Deactivate a bot
  router.post('/:botId/deactivate', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      await botManager.deactivateBot(botId);

      res.json({
        success: true,
        message: 'Bot deactivated successfully'
      } as APIResponse);

    } catch (error) {
      console.error('Error deactivating bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate bot'
      } as APIResponse);
    }
  });

  // Delete a bot
  router.delete('/:botId', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      await botManager.deleteBot(botId);

      res.json({
        success: true,
        message: 'Bot deleted successfully'
      } as APIResponse);

    } catch (error) {
      console.error('Error deleting bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete bot'
      } as APIResponse);
    }
  });

  // Get bot execution logs
  router.get('/:botId/logs', (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      const logs = botManager.getBotLogs(botId);

      res.json({
        success: true,
        data: logs
      } as APIResponse);

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bot logs'
      } as APIResponse);
    }
  });

  // Optimize bot strategy
  router.post('/:botId/optimize', async (req: Request, res: Response) => {
    try {
      const { botId } = req.params;
      await botManager.optimizeBot(botId);

      res.json({
        success: true,
        message: 'Bot strategy optimized successfully'
      } as APIResponse);

    } catch (error) {
      console.error('Error optimizing bot:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to optimize bot'
      } as APIResponse);
    }
  });

  // Get active bots
  router.get('/status/active', (req: Request, res: Response) => {
    try {
      const activeBots = botManager.getActiveBots();
      res.json({
        success: true,
        data: activeBots,
        message: `${activeBots.length} active bots`
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch active bots'
      } as APIResponse);
    }
  });

  // Get price history
  router.get('/market/price-history', (req: Request, res: Response) => {
    try {
      const priceHistory = botManager.getPriceHistory();
      const limit = parseInt(req.query.limit as string) || 100;
      
      res.json({
        success: true,
        data: priceHistory.slice(-limit),
        message: `Last ${Math.min(limit, priceHistory.length)} price points`
      } as APIResponse);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch price history'
      } as APIResponse);
    }
  });

  // Get bots by user wallet
  router.get('/user/:userWallet', async (req: Request, res: Response) => {
    try {
      const { userWallet } = req.params;
      
      if (!userWallet) {
        return res.status(400).json({
          success: false,
          error: 'User wallet address is required'
        } as APIResponse);
      }

      const bots = await botManager.getBotsByUserWallet(userWallet);
      
      res.json({
        success: true,
        data: bots,
        message: `Found ${bots.length} bots for wallet ${userWallet}`
      } as APIResponse);

    } catch (error) {
      console.error('Error fetching bots by wallet:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bots by wallet'
      } as APIResponse);
    }
  });

  return router;
}