import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { TokenPriceData } from '../types';

export interface HyperliquidPriceData {
  coin: string;
  side: string;
  px: string;
  sz: string;
  time: number;
  tid: number;
}

export class HyperliquidWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private subscriptionId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private isConnecting = false;
  private targetCoin: string;
  private isTestnet: boolean;

  constructor(targetCoin: string = 'SOL', isTestnet: boolean = false) {
    super();
    this.targetCoin = targetCoin;
    this.isTestnet = isTestnet;
  }

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const wsUrl = this.isTestnet 
        ? 'wss://api.hyperliquid-testnet.xyz/ws'
        : 'wss://api.hyperliquid.xyz/ws';
      
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log(`🔗 Connected to Hyperliquid WebSocket (${this.isTestnet ? 'testnet' : 'mainnet'})`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.subscribe();
        this.emit('connected');
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      this.ws.on('close', () => {
        console.log('🔌 Hyperliquid WebSocket connection closed');
        this.isConnecting = false;
        this.emit('disconnected');
        this.attemptReconnect();
      });

      this.ws.on('error', (error) => {
        console.error('📡 Hyperliquid WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', error);
      });

    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to create WebSocket connection:', error);
      throw error;
    }
  }

  private subscribe(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot subscribe - WebSocket not connected');
      return;
    }

    const subscriptionMessage = {
      method: 'subscribe',
      subscription: {
        type: 'trades',
        coin: this.targetCoin
      }
    };

    console.log(`📡 Subscribing to Hyperliquid trades for ${this.targetCoin}...`);
    this.ws.send(JSON.stringify(subscriptionMessage));
  }

  private handleMessage(message: any): void {
    if (message.channel === 'subscriptionResponse') {
      // Subscription confirmation
      console.log(`✅ Subscription confirmed for ${this.targetCoin}`);
      this.emit('subscribed', message.data);
    } else if (message.channel === 'trades') {
      // Trade data updates
      const tradeData = message.data as HyperliquidPriceData[];
      tradeData.forEach((trade) => {
        if (this.isValidTradeData(trade)) {
          const tokenData: TokenPriceData = {
            timestamp: trade.time,
            price: parseFloat(trade.px),
            marketDepthUSDUp: 0, // Not available in Hyperliquid trades
            marketDepthUSDDown: 0, // Not available in Hyperliquid trades
            volume24h: parseFloat(trade.sz),
            baseSymbol: trade.coin,
            quoteSymbol: 'USD'
          };

          console.log(`💰 Trade Update: ${tokenData.baseSymbol}/USD = $${tokenData.price} (Size: ${trade.sz})`);
          this.emit('priceUpdate', tokenData);
        }
      });
    } else {
      console.log('📨 Received message:', message);
    }
  }

  private isValidTradeData(data: any): boolean {
    return (
      data &&
      typeof data.time === 'number' &&
      typeof data.px === 'string' &&
      typeof data.sz === 'string' &&
      typeof data.coin === 'string'
    );
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, this.reconnectInterval);
  }

  async disconnect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Send unsubscribe message
      const unsubscribeMessage = {
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
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): string {
    if (!this.ws) return 'not_initialized';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  // Method to get historical price data if needed
  async getHistoricalData(timeframe: string = '1h', limit: number = 100): Promise<TokenPriceData[]> {
    // Hyperliquid has REST API endpoints for historical data
    // For now, return empty array as this is primarily a WebSocket service
    console.log(`📊 Historical data requested for ${this.targetCoin}, ${timeframe} timeframe, ${limit} points`);
    return [];
  }

  // Method to change subscription to different coin
  async updateSubscription(newCoin: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to WebSocket');
    }

    // Unsubscribe from current subscription
    await this.unsubscribe();

    // Update target coin and subscribe
    this.targetCoin = newCoin;
    this.subscribe();
  }

  private async unsubscribe(): Promise<void> {
    if (!this.isConnected()) {
      return;
    }

    const unsubscribeMessage = {
      method: 'unsubscribe',
      subscription: {
        type: 'trades',
        coin: this.targetCoin
      }
    };

    this.ws!.send(JSON.stringify(unsubscribeMessage));
  }

  // Method to subscribe to multiple coins
  async subscribeToMultipleCoins(coins: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to WebSocket');
    }

    for (const coin of coins) {
      const subscriptionMessage = {
        method: 'subscribe',
        subscription: {
          type: 'trades',
          coin: coin
        }
      };
      
      console.log(`📡 Subscribing to ${coin} trades...`);
      this.ws!.send(JSON.stringify(subscriptionMessage));
    }
  }
}