import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TradingBot } from '../types';

export interface AgentRecord {
  id?: number;
  created_at?: string;
  user_wallet: string;
  agent_name: string;
  public_key: string;
  private_key: string;
  agent_configuration: string; // JSON string of bot configuration
  agent_deployed_link?: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = 'https://vxhyydxzwewkirdsxtvz.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4aHl5ZHh6d2V3a2lyZHN4dHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDY2ODU1NCwiZXhwIjoyMDcwMjQ0NTU0fQ.avmTS2Af8z04BUtBDpeA0RnUJ8up62Olt8Z7XFCdvBI';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async saveAgent(userWallet: string, bot: TradingBot): Promise<AgentRecord> {
    try {
      console.log(`💾 Saving agent to Supabase: ${bot.name}`);
      
      const agentData: Omit<AgentRecord, 'id' | 'created_at'> = {
        user_wallet: userWallet,
        agent_name: bot.name,
        public_key: bot.swapConfig.senderAddress,
        private_key: bot.swapConfig.senderPrivateKey,
        agent_configuration: JSON.stringify({
          id: bot.id,
          name: bot.name,
          strategy: bot.strategy,
          swapConfig: bot.swapConfig,
          isActive: bot.isActive,
          createdAt: bot.createdAt,
          executionCount: bot.executionCount,
          generatedCode: bot.generatedCode,
          vercelDeploymentUrl: bot.vercelDeploymentUrl
        }),
        agent_deployed_link: bot.vercelDeploymentUrl || undefined
      };

      const { data, error } = await this.supabase
        .from('agents')
        .insert([agentData])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase save error:', error);
        throw new Error(`Failed to save agent: ${error.message}`);
      }

      console.log(`✅ Agent saved to Supabase with ID: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ Error saving agent to Supabase:', error);
      throw error;
    }
  }

  async updateAgent(agentId: number, updates: Partial<AgentRecord>): Promise<AgentRecord> {
    try {
      console.log(`🔄 Updating agent ${agentId} in Supabase`);

      const { data, error } = await this.supabase
        .from('agents')
        .update(updates)
        .eq('id', agentId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw new Error(`Failed to update agent: ${error.message}`);
      }

      console.log(`✅ Agent ${agentId} updated in Supabase`);
      return data;

    } catch (error) {
      console.error('❌ Error updating agent in Supabase:', error);
      throw error;
    }
  }

  async getAgentsByWallet(userWallet: string): Promise<AgentRecord[]> {
    try {
      console.log(`🔍 Fetching agents for wallet: ${userWallet}`);

      const { data, error } = await this.supabase
        .from('agents')
        .select('*')
        .eq('user_wallet', userWallet)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        throw new Error(`Failed to fetch agents: ${error.message}`);
      }

      console.log(`✅ Found ${data?.length || 0} agents for wallet ${userWallet}`);
      return data || [];

    } catch (error) {
      console.error('❌ Error fetching agents from Supabase:', error);
      throw error;
    }
  }

  async getAllActiveAgents(): Promise<AgentRecord[]> {
    try {
      console.log('🔍 Fetching all active agents from Supabase');

      const { data, error } = await this.supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase fetch error:', error);
        throw new Error(`Failed to fetch agents: ${error.message}`);
      }

      // Filter for active agents by parsing configuration
      const activeAgents = data?.filter(agent => {
        try {
          const config = JSON.parse(agent.agent_configuration);
          return config.isActive === true;
        } catch {
          return false;
        }
      }) || [];

      console.log(`✅ Found ${activeAgents.length} active agents in Supabase`);
      return activeAgents;

    } catch (error) {
      console.error('❌ Error fetching active agents from Supabase:', error);
      throw error;
    }
  }

  async deleteAgent(agentId: number): Promise<void> {
    try {
      console.log(`🗑️ Deleting agent ${agentId} from Supabase`);

      const { error } = await this.supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        throw new Error(`Failed to delete agent: ${error.message}`);
      }

      console.log(`✅ Agent ${agentId} deleted from Supabase`);

    } catch (error) {
      console.error('❌ Error deleting agent from Supabase:', error);
      throw error;
    }
  }

  // Convert AgentRecord back to TradingBot
  agentRecordToBot(agent: AgentRecord): TradingBot {
    try {
      const config = JSON.parse(agent.agent_configuration);
      return {
        id: config.id,
        name: config.name,
        strategy: config.strategy,
        swapConfig: config.swapConfig,
        isActive: config.isActive,
        createdAt: new Date(config.createdAt),
        lastExecution: config.lastExecution ? new Date(config.lastExecution) : undefined,
        executionCount: config.executionCount || 0,
        generatedCode: config.generatedCode,
        vercelDeploymentUrl: config.vercelDeploymentUrl
      };
    } catch (error) {
      console.error('❌ Error parsing agent configuration:', error);
      throw new Error('Invalid agent configuration format');
    }
  }

  // Update agent status (active/inactive)
  async updateAgentStatus(agentId: number, isActive: boolean, bot: TradingBot): Promise<void> {
    try {
      const updatedConfig = {
        ...JSON.parse(await this.getAgentConfiguration(agentId)),
        isActive,
        lastExecution: bot.lastExecution,
        executionCount: bot.executionCount
      };

      await this.updateAgent(agentId, {
        agent_configuration: JSON.stringify(updatedConfig)
      });

    } catch (error) {
      console.error('❌ Error updating agent status:', error);
      throw error;
    }
  }

  private async getAgentConfiguration(agentId: number): Promise<string> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('agent_configuration')
      .eq('id', agentId)
      .single();

    if (error) {
      throw new Error(`Failed to get agent configuration: ${error.message}`);
    }

    return data.agent_configuration;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('agents')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
      }

      console.log('✅ Supabase connection successful');
      return true;

    } catch (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }
  }
}
