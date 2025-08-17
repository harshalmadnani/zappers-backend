# 🚀 Render Deployment Guide

## 📋 Prerequisites

1. ✅ Private keys removed from repository (completed)
2. ✅ GitHub repository ready
3. ✅ Render account created

## 🔧 Step 1: Environment Variables Setup

In your Render dashboard, you'll need to set these environment variables:

### 🔑 Required Environment Variables

```bash
# Node.js Environment
NODE_ENV=production
PORT=10000

# API Keys (Set these in Render dashboard - DO NOT commit to git)
OPENAI_API_KEY=your_openai_api_key_here
VERCEL_TOKEN=your_vercel_token_here



# Network Configuration
IS_TESTNET=false

# Security (Optional - for CORS restriction)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-app.com
```

### 🛡️ Security Environment Variables

```bash
# Add these for enhanced security
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
API_KEY_HEADER=x-api-key     # Custom API key header name
```

## 🚀 Step 2: Deploy to Render

### Option A: Deploy via GitHub (Recommended)

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select `trading-bot-api` repository

2. **Configure Service**:
   ```yaml
   Name: trading-bot-api
   Environment: Node
   Build Command: npm install
   Start Command: node enhanced-server.js
   ```

3. **Set Environment Variables**:
   - Go to "Environment" tab
   - Add all the environment variables listed above
   - **CRITICAL**: Never paste private keys here - use placeholders and update manually

### Option B: Deploy via render.yaml (Automatic)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Auto-Deploy**:
   - Render will automatically detect `render.yaml`
   - Service will be created with the configuration
   - Add environment variables in Render dashboard

## 🔧 Step 3: Configure Production Settings

### In Render Dashboard:

1. **Health Checks**:
   - Health Check Path: `/api/health`
   - Health Check Grace Period: 30 seconds

2. **Auto-Deploy**:
   - Enable "Auto-Deploy" from GitHub
   - Deploy on every push to `main` branch

3. **Custom Domain** (Optional):
   - Add your custom domain
   - Update ALLOWED_ORIGINS to include your domain

## 🧪 Step 4: Test Deployment

### Test Endpoints:

```bash
# Replace YOUR_RENDER_URL with your actual Render URL
export API_URL="https://your-app.onrender.com"

# Health check
curl $API_URL/api/health

# API info
curl $API_URL/api/info

# Test bot creation (with environment variables)
curl -X POST $API_URL/api/bots \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Test Bot",
    "prompt": "Test bot for production deployment",
    "targetCoin": "ETH",
    "swapConfig": {
      "senderAddress": "YOUR_WALLET_ADDRESS",
      "senderPrivateKey": "YOUR_PRIVATE_KEY",
      "recipientAddress": "YOUR_RECIPIENT_ADDRESS",
      "originSymbol": "USDC",
      "originBlockchain": "BASE",
      "destinationSymbol": "ETH",
      "destinationBlockchain": "BASE",
      "amount": "0.1",
      "isTest": true
    }
  }'
```

## 🔒 Security Checklist

### ✅ Pre-Deployment Security:

- [ ] Private keys removed from all files
- [ ] Environment variables configured in Render (not in code)
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled (if implemented)
- [ ] Input validation in place
- [ ] Error messages don't expose sensitive information

### ✅ Post-Deployment Security:

- [ ] Test all endpoints work correctly
- [ ] Verify private keys are not exposed in logs
- [ ] Check CORS is working properly
- [ ] Monitor for any security issues
- [ ] Set up logging and monitoring

## 🚨 Critical Security Notes

### 🔐 Private Key Management:

1. **Never commit private keys to git**
2. **Use environment variables in Render dashboard**
3. **Generate new private keys for production**
4. **Use separate wallets for testing and production**

### 🛡️ Production Hardening:

```javascript
// Add these to enhanced-server.js for production
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

## 📊 Monitoring & Logs

### View Logs in Render:
1. Go to your service dashboard
2. Click "Logs" tab
3. Monitor for errors and bot activities

### Health Monitoring:
- Render automatically monitors `/api/health`
- Set up alerts for downtime
- Monitor response times

## 🔄 Updating Your Deployment

```bash
# Make changes to your code
git add .
git commit -m "Update bot functionality"
git push origin main

# Render will automatically redeploy
```

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies in package.json
   - Check build logs in Render dashboard

2. **Environment Variable Issues**:
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify API keys are valid

3. **CORS Issues**:
   - Update ALLOWED_ORIGINS environment variable
   - Check if frontend domain is included

4. **Bot Creation Failures**:
   - Check wallet has sufficient balance
   - Ensure private keys are correctly set

## 📞 Support

- [Render Documentation](https://render.com/docs)
- [GitHub Issues](https://github.com/your-repo/issues)
- Check logs in Render dashboard for specific errors

---

**🎉 Congratulations!** Your trading bot API is now securely deployed on Render!
