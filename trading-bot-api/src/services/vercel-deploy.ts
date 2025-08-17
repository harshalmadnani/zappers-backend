import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export interface VercelDeployment {
  id: string;
  url: string;
  name: string;
  status: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
}

export class VercelDeployService {
  private token: string;
  private teamId?: string;

  constructor(token: string, teamId?: string) {
    this.token = token;
    this.teamId = teamId;
  }

  async deployBot(
    botId: string,
    botName: string,
    generatedCode: string,
    environmentVariables: Record<string, string> = {}
  ): Promise<VercelDeployment> {
    try {
      console.log(`🚀 Deploying bot "${botName}" to Vercel...`);

      // Create deployment package
      const deploymentData = {
        name: `trading-bot-${botId}`,
        files: [
          {
            file: 'api/bot.ts',
            data: generatedCode
          },
          {
            file: 'package.json',
            data: JSON.stringify({
              name: `trading-bot-${botId}`,
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

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      };

      if (this.teamId) {
        headers['X-Vercel-Team-Id'] = this.teamId;
      }

      const response = await axios.post(
        'https://api.vercel.com/v13/deployments',
        deploymentData,
        {
          headers,
          timeout: 60000 // 60 seconds
        }
      );

      const deployment = response.data;
      console.log(`✅ Bot deployed successfully! URL: https://${deployment.url}`);

      return {
        id: deployment.id,
        url: `https://${deployment.url}`,
        name: deployment.name,
        status: deployment.readyState || 'BUILDING',
        createdAt: Date.now()
      };

    } catch (error) {
      console.error('❌ Vercel deployment failed:', error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.message || error.message;
        throw new Error(`Vercel deployment failed: ${errorMessage}`);
      }

      throw new Error(`Vercel deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDeploymentStatus(deploymentId: string): Promise<VercelDeployment | null> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`
      };

      if (this.teamId) {
        headers['X-Vercel-Team-Id'] = this.teamId;
      }

      const response = await axios.get(
        `https://api.vercel.com/v13/deployments/${deploymentId}`,
        { headers }
      );

      const deployment = response.data;
      
      return {
        id: deployment.id,
        url: `https://${deployment.url}`,
        name: deployment.name,
        status: deployment.readyState,
        createdAt: deployment.createdAt
      };

    } catch (error) {
      console.error('Error fetching deployment status:', error);
      return null;
    }
  }

  async deleteDeployment(deploymentId: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`
      };

      if (this.teamId) {
        headers['X-Vercel-Team-Id'] = this.teamId;
      }

      await axios.delete(
        `https://api.vercel.com/v13/deployments/${deploymentId}`,
        { headers }
      );

      console.log(`🗑️ Deployment ${deploymentId} deleted successfully`);
      return true;

    } catch (error) {
      console.error('Error deleting deployment:', error);
      return false;
    }
  }

  async listDeployments(projectName?: string): Promise<VercelDeployment[]> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`
      };

      if (this.teamId) {
        headers['X-Vercel-Team-Id'] = this.teamId;
      }

      let url = 'https://api.vercel.com/v6/deployments';
      if (projectName) {
        url += `?projectId=${projectName}`;
      }

      const response = await axios.get(url, { headers });

      return response.data.deployments.map((deployment: any) => ({
        id: deployment.id,
        url: `https://${deployment.url}`,
        name: deployment.name,
        status: deployment.readyState,
        createdAt: deployment.createdAt
      }));

    } catch (error) {
      console.error('Error listing deployments:', error);
      return [];
    }
  }

  // Helper method to generate environment variables for the bot
  generateBotEnvironmentVariables(
    openaiApiKey: string,
    placeholder: string, // Not used for Hyperliquid
    nearIntentsApiUrl: string,
    targetCoin: string,
    swapConfig: any
  ): Record<string, string> {
    return {
      OPENAI_API_KEY: openaiApiKey,
      NEAR_INTENTS_API_URL: nearIntentsApiUrl,
      TARGET_COIN: targetCoin,
      IS_TESTNET: 'false',
      SWAP_CONFIG: JSON.stringify(swapConfig),
      NODE_ENV: 'production'
    };
  }

  // Method to check if Vercel token is valid
  async validateToken(): Promise<boolean> {
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`
      };

      if (this.teamId) {
        headers['X-Vercel-Team-Id'] = this.teamId;
      }

      const response = await axios.get(
        'https://api.vercel.com/v2/user',
        { headers }
      );

      return response.status === 200;

    } catch (error) {
      console.error('Vercel token validation failed:', error);
      return false;
    }
  }
}