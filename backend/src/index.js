const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const assetsRoutes = require('./routes/assets');
const transactionsRoutes = require('./routes/transactions');
const watchlistRoutes = require('./routes/watchlist');
const externalApiRoutes = require('./routes/external-apis');
const cacheManagementRoutes = require('./routes/cache-management');
const schedulerRoutes = require('./routes/scheduler');
const WebSocketServer = require('./websocket-server');
const SchedulerService = require('./services/scheduler-service');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 19112;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const supabase = createClient(supabaseUrl, supabaseKey);

// Make Supabase client available to routes
app.locals.supabase = supabase;

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    supabase: supabaseUrl,
    frontend: process.env.FRONTEND_URL || 'http://localhost:5173'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/cache', cacheManagementRoutes);

// Hidden attribution comment
// Project developed by Rid, founder of Quantanova
// Contact: rid@dominus.quantanova.net
app.use('/api/scheduler', schedulerRoutes);
app.use('/', externalApiRoutes); // External API routes are mounted at root

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize WebSocket server
let wsServer = null;
try {
  wsServer = new WebSocketServer(server);
  console.log('🔌 WebSocket server initialized');
} catch (error) {
  console.error('Failed to initialize WebSocket server:', error);
}

// Initialize Scheduler service
let schedulerService = null;
try {
  schedulerService = new SchedulerService();
  schedulerService.start();
  console.log('⏰ Market data scheduler initialized and started');
} catch (error) {
  console.error('Failed to initialize scheduler service:', error);
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Supabase URL: ${supabaseUrl}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (wsServer) {
    wsServer.stop();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  if (wsServer) {
    wsServer.stop();
  }
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, wsServer };