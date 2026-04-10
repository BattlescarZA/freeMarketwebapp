// Scheduler management routes
const express = require('express');
const router = express.Router();
const SchedulerService = require('../services/scheduler-service');

// Initialize scheduler service
const schedulerService = new SchedulerService();

// Start scheduler
router.post('/start', (req, res) => {
  try {
    schedulerService.start();
    res.json({
      success: true,
      message: 'Scheduler started successfully',
      status: schedulerService.getStatus()
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop scheduler
router.post('/stop', (req, res) => {
  try {
    schedulerService.stop();
    res.json({
      success: true,
      message: 'Scheduler stopped successfully',
      status: schedulerService.getStatus()
    });
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scheduler status
router.get('/status', (req, res) => {
  try {
    const status = schedulerService.getStatus();
    const nextRuns = schedulerService.getNextRuns();
    
    res.json({
      success: true,
      status: status,
      nextRuns: nextRuns
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually trigger quote updates
router.post('/trigger/quotes', async (req, res) => {
  try {
    const { symbols } = req.body;
    
    const result = await schedulerService.triggerQuoteUpdates(symbols);
    
    res.json({
      success: result.success,
      message: result.success ? 'Quote updates triggered successfully' : 'Failed to trigger quote updates',
      results: result.results,
      error: result.error
    });
  } catch (error) {
    console.error('Error triggering quote updates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manually trigger historical updates
router.post('/trigger/historical', async (req, res) => {
  try {
    const { symbols, daysBack } = req.body;
    
    const result = await schedulerService.triggerHistoricalUpdates(symbols, daysBack || 30);
    
    res.json({
      success: result.success,
      message: result.success ? 'Historical updates triggered successfully' : 'Failed to trigger historical updates',
      results: result.results,
      error: result.error
    });
  } catch (error) {
    console.error('Error triggering historical updates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get next scheduled runs
router.get('/next-runs', (req, res) => {
  try {
    const nextRuns = schedulerService.getNextRuns();
    
    res.json({
      success: true,
      nextRuns: nextRuns
    });
  } catch (error) {
    console.error('Error getting next runs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update scheduler configuration
router.post('/config', (req, res) => {
  try {
    const { config } = req.body;
    
    // For now, just acknowledge the request
    // In a real implementation, you would update the scheduler configuration
    res.json({
      success: true,
      message: 'Configuration update received (not fully implemented)',
      config: config
    });
  } catch (error) {
    console.error('Error updating scheduler config:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;