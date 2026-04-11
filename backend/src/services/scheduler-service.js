// Scheduler service for automatic market data updates
const cron = require('node-cron');
const MarketDataService = require('./market-data-service');

class SchedulerService {
  constructor() {
    this.marketDataService = new MarketDataService();
    this.jobs = {};
    this.isRunning = false;
  }

  // Start all scheduled jobs
  start() {
    if (this.isRunning) {
      console.log('Scheduler is already running');
      return;
    }

    console.log('Starting market data scheduler...');
    
    // Schedule quote updates every 5 minutes during market hours (9:30 AM - 4:00 PM EST, Mon-Fri)
    this.jobs.quoteUpdates = cron.schedule('*/5 9-16 * * 1-5', async () => {
      console.log('Running scheduled quote updates...');
      try {
        const results = await this.marketDataService.updatePopularSymbols();
        console.log(`Quote updates completed: ${results.quoteResults.filter(r => r.success).length}/${results.quoteResults.length} successful`);
      } catch (error) {
        console.error('Error in scheduled quote updates:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });

    // Schedule historical data updates once per day at 6:00 PM EST
    this.jobs.historicalUpdates = cron.schedule('0 18 * * 1-5', async () => {
      console.log('Running scheduled historical data updates...');
      try {
        const popularSymbols = [
          // Top stocks
          'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V',
          // Top 10 cryptocurrencies (by market cap)
          'BTC-USD', 'ETH-USD', 'BNB-USD', 'XRP-USD', 'SOL-USD',
          'ADA-USD', 'DOGE-USD', 'AVAX-USD', 'DOT-USD', 'MATIC-USD',
          // ETFs
          'SPY', 'QQQ', 'VTI'
        ];
        
        const results = await this.marketDataService.updateMultipleSymbols(
          popularSymbols, 
          'historical', 
          'yahoo'
        );
        
        const successful = results.filter(r => r.success).length;
        console.log(`Historical updates completed: ${successful}/${results.length} successful`);
      } catch (error) {
        console.error('Error in scheduled historical updates:', error);
      }
    }, {
      scheduled: true,
      timezone: 'America/New_York'
    });

    // Schedule cache cleanup every hour
    this.jobs.cacheCleanup = cron.schedule('0 * * * *', async () => {
      console.log('Running cache cleanup...');
      try {
        // This would clean expired cache entries
        // For now, just log it
        console.log('Cache cleanup scheduled (not implemented yet)');
      } catch (error) {
        console.error('Error in cache cleanup:', error);
      }
    });

    // Schedule database maintenance (clean old data) every day at 2:00 AM
    this.jobs.dbMaintenance = cron.schedule('0 2 * * *', async () => {
      console.log('Running database maintenance...');
      try {
        // This would clean old historical data
        // For now, just log it
        console.log('Database maintenance scheduled (not implemented yet)');
      } catch (error) {
        console.error('Error in database maintenance:', error);
      }
    });

    // Run initial update on startup
    setTimeout(async () => {
      console.log('Running initial market data update on startup...');
      try {
        const results = await this.marketDataService.updatePopularSymbols();
        console.log(`Initial update completed: ${results.quoteResults.filter(r => r.success).length}/${results.quoteResults.length} quotes successful`);
      } catch (error) {
        console.error('Error in initial update:', error);
      }
    }, 5000); // Wait 5 seconds for services to initialize

    this.isRunning = true;
    console.log('Market data scheduler started successfully');
  }

  // Stop all scheduled jobs
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler is not running');
      return;
    }

    console.log('Stopping market data scheduler...');
    
    Object.values(this.jobs).forEach(job => {
      if (job && job.stop) {
        job.stop();
      }
    });
    
    this.jobs = {};
    this.isRunning = false;
    console.log('Market data scheduler stopped successfully');
  }

  // Get scheduler status
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: {}
    };

    Object.entries(this.jobs).forEach(([name, job]) => {
      status.jobs[name] = {
        scheduled: job && typeof job.getStatus === 'function' ? job.getStatus() : 'unknown'
      };
    });

    return status;
  }

  // Manually trigger quote updates
  async triggerQuoteUpdates(symbols = null) {
    console.log('Manually triggering quote updates...');
    
    try {
      let results;
      if (symbols) {
        results = await this.marketDataService.updateMultipleSymbols(symbols, 'quote', 'yahoo');
      } else {
        const updateResults = await this.marketDataService.updatePopularSymbols();
        results = updateResults.quoteResults;
      }
      
      const successful = results.filter(r => r.success).length;
      console.log(`Manual quote updates completed: ${successful}/${results.length} successful`);
      
      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error in manual quote updates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Manually trigger historical updates
  async triggerHistoricalUpdates(symbols = null, daysBack = 30) {
    console.log('Manually triggering historical updates...');
    
    try {
      let symbolsToUpdate = symbols;
      if (!symbolsToUpdate) {
        symbolsToUpdate = [
          'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V',
          'BTC-USD', 'ETH-USD', 'SPY', 'QQQ', 'VTI'
        ];
      }
      
      const results = [];
      for (const symbol of symbolsToUpdate) {
        try {
          const records = await this.marketDataService.updateHistoricalData(
            symbol, 
            '1d', 
            daysBack, 
            'yahoo'
          );
          results.push({
            symbol,
            success: records > 0,
            records: records
          });
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error updating historical data for ${symbol}:`, error);
          results.push({
            symbol,
            success: false,
            error: error.message
          });
        }
      }
      
      const successful = results.filter(r => r.success).length;
      console.log(`Manual historical updates completed: ${successful}/${results.length} successful`);
      
      return {
        success: true,
        results: results
      };
    } catch (error) {
      console.error('Error in manual historical updates:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get next scheduled run times
  getNextRuns() {
    const nextRuns = {};
    
    if (this.jobs.quoteUpdates && this.jobs.quoteUpdates.nextDate) {
      nextRuns.quoteUpdates = this.jobs.quoteUpdates.nextDate().toISOString();
    }
    
    if (this.jobs.historicalUpdates && this.jobs.historicalUpdates.nextDate) {
      nextRuns.historicalUpdates = this.jobs.historicalUpdates.nextDate().toISOString();
    }
    
    if (this.jobs.cacheCleanup && this.jobs.cacheCleanup.nextDate) {
      nextRuns.cacheCleanup = this.jobs.cacheCleanup.nextDate().toISOString();
    }
    
    if (this.jobs.dbMaintenance && this.jobs.dbMaintenance.nextDate) {
      nextRuns.dbMaintenance = this.jobs.dbMaintenance.nextDate().toISOString();
    }
    
    return nextRuns;
  }
}

module.exports = SchedulerService;