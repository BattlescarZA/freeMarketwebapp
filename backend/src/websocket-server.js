// WebSocket server for real-time market data
const WebSocket = require('ws');
const fetch = require('node-fetch');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Set();
    this.priceCache = new Map();
    this.pollingInterval = null;
    
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      // Send initial cached prices
      if (this.priceCache.size > 0) {
        ws.send(JSON.stringify({
          type: 'initial_prices',
          data: Object.fromEntries(this.priceCache)
        }));
      }

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });

    // Start polling for price updates
    this.startPricePolling();
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        this.handleSubscribe(ws, data.symbols);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(ws, data.symbols);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  handleSubscribe(ws, symbols) {
    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    // Store subscription for this client
    ws.subscriptions = ws.subscriptions || new Set();
    symbols.forEach(symbol => {
      ws.subscriptions.add(symbol);
    });

    // Send current prices for subscribed symbols
    symbols.forEach(symbol => {
      if (this.priceCache.has(symbol)) {
        ws.send(JSON.stringify({
          type: 'price_update',
          symbol,
          price: this.priceCache.get(symbol)
        }));
      }
    });

    console.log(`Client subscribed to: ${symbols.join(', ')}`);
  }

  handleUnsubscribe(ws, symbols) {
    if (!ws.subscriptions) return;

    if (!Array.isArray(symbols)) {
      symbols = [symbols];
    }

    symbols.forEach(symbol => {
      ws.subscriptions.delete(symbol);
    });

    console.log(`Client unsubscribed from: ${symbols.join(', ')}`);
  }

  async fetchPrices(symbols) {
    if (!symbols || symbols.length === 0) return;

    try {
      // Fetch prices from Massive API
      const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;
      
      if (!MASSIVE_API_KEY) {
        console.warn('Massive API key not configured for WebSocket server');
        return;
      }

      // For now, we'll simulate price updates
      // In production, you would make actual API calls
      const updates = {};
      
      symbols.forEach(symbol => {
        // Simulate price change (±1%)
        const currentPrice = this.priceCache.get(symbol) || 100;
        const change = (Math.random() - 0.5) * 2; // -1% to +1%
        const newPrice = currentPrice * (1 + change / 100);
        
        updates[symbol] = {
          price: parseFloat(newPrice.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          changePercent: parseFloat(change.toFixed(2)),
          timestamp: Date.now()
        };
        
        this.priceCache.set(symbol, updates[symbol]);
      });

      return updates;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return {};
    }
  }

  startPricePolling() {
    // Poll every 5 seconds for demo purposes
    // In production, you might want to use WebSocket streams from the API
    this.pollingInterval = setInterval(async () => {
      try {
        // Get all subscribed symbols from all clients
        const allSymbols = new Set();
        
        this.clients.forEach(client => {
          if (client.subscriptions && client.subscriptions.size > 0) {
            client.subscriptions.forEach(symbol => {
              allSymbols.add(symbol);
            });
          }
        });

        if (allSymbols.size === 0) return;

        const symbols = Array.from(allSymbols);
        const priceUpdates = await this.fetchPrices(symbols);

        // Broadcast updates to subscribed clients
        this.broadcastPriceUpdates(priceUpdates);
      } catch (error) {
        console.error('Error in price polling:', error);
      }
    }, 5000); // 5 seconds
  }

  broadcastPriceUpdates(updates) {
    if (!updates || Object.keys(updates).length === 0) return;

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.subscriptions) {
        Object.entries(updates).forEach(([symbol, data]) => {
          if (client.subscriptions.has(symbol)) {
            client.send(JSON.stringify({
              type: 'price_update',
              symbol,
              ...data
            }));
          }
        });
      }
    });
  }

  broadcastToAll(message) {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    this.wss.close();
  }
}

module.exports = WebSocketServer;