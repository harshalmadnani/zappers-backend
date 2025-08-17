const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    },
    message: 'Trading Bot API is running'
  });
});


app.post('/api/bots', async (req, res) => {
  try {
    console.log('🤖 Creating bot with config:', JSON.stringify(req.body, null, 2));
    
    const { name, swapConfig } = req.body;
    
    if (!name || !swapConfig) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name and swapConfig'
      });
    }

    const https = require('https');
    
    const testSwap = () => {
      return new Promise((resolve, reject) => {
        const data = JSON.stringify(swapConfig);
        
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
          }
        };

        const req = https.request('https://near-api-4kbh.onrender.com/api/swap', options, (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              const response = JSON.parse(body);
              resolve(response);
            } catch (error) {
              reject(new Error(`Parse Error: ${error.message}`));
            }
          });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
      });
    };

    // Test the swap
    const swapResult = await testSwap();
    
    if (swapResult.success) {
      // Create bot entry
      const bot = {
        id: `bot-${Date.now()}`,
        name,
        swapConfig,
        isActive: true,
        createdAt: new Date().toISOString(),
        testResult: swapResult
      };

      console.log(`✅ Bot "${name}" created successfully!`);
      console.log(`   📊 Test swap result: ${swapResult.quote?.quote?.amountOutFormatted || 'N/A'}`);

      res.json({
        success: true,
        data: bot,
        message: `Bot "${name}" created and tested successfully`
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Swap configuration test failed',
        details: swapResult.error || swapResult
      });
    }

  } catch (error) {
    console.error('❌ Error creating bot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bot',
      details: error.message
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Simple Trading Bot API Server started on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🤖 Create bot: POST http://localhost:${PORT}/api/bots`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('🔌 Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.emit('SIGTERM');
});

module.exports = app;
