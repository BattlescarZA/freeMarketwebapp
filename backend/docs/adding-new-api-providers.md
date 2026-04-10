# Adding New Free API Providers to VibeFinance

## 🚀 Quick Start: Add a New Provider in 5 Steps

### Step 1: Get API Key (if required)
1. Visit the provider's website
2. Sign up for a free account
3. Generate an API key
4. Add to `.env` file:
```bash
NEW_PROVIDER_API_KEY=your_key_here
```

### Step 2: Update API Configuration
Add provider to [`backend/src/config/api-providers.js`](backend/src/config/api-providers.js):
```javascript
{
  id: 'newprovider',
  name: 'New Provider',
  baseUrl: 'https://api.newprovider.com/v1',
  requiresKey: true,
  rateLimit: { requestsPerMinute: 10, requestsPerDay: 1000 },
  capabilities: ['quotes', 'historical'],
  priority: 3,
  region: 'global'
}
```

### Step 3: Add Environment Variable
Update `.env.example` and ensure the variable is loaded in the backend.

### Step 4: Create Route Handler (Optional)
If the provider needs special handling, add to [`backend/src/routes/external-apis.js`](backend/src/routes/external-apis.js):
```javascript
router.get('/api/external/newprovider/quote/:symbol', 
  newProviderRateLimit, 
  cacheMiddleware, 
  async (req, res) => {
    // Implementation here
  }
);
```

### Step 5: Test the Integration
```bash
# Test the new endpoint
curl http://localhost:19112/api/external/newprovider/quote/AAPL
```

## 📋 Recommended Providers to Add Now

### 1. **Twelve Data** (High Priority)
- **Why**: Good free tier (800 calls/day), global coverage
- **Signup**: https://twelvedata.com/apikey
- **Capabilities**: Stocks, forex, crypto, ETFs
- **Rate Limit**: 8 requests/minute

### 2. **IEX Cloud** (Medium Priority)
- **Why**: Clean API, 50K messages/month free
- **Signup**: https://iexcloud.io/cloud-login#/register
- **Capabilities**: US stocks, fundamentals, news
- **Best For**: US market data backup

### 3. **GNews** (Low Priority)
- **Why**: Financial news with sentiment analysis
- **Signup**: https://gnews.io/register
- **Capabilities**: News search, sentiment scores
- **Rate Limit**: 100 requests/day

## 🔧 Implementation Templates

### Stock Quote Endpoint Template
```javascript
router.get('/api/external/twelvedata/quote/:symbol', 
  twelvedataRateLimit, 
  cacheMiddleware, 
  async (req, res) => {
    try {
      const { symbol } = req.params;
      const apiKey = process.env.TWELVE_DATA_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'Twelve Data API key not configured' });
      }

      const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
      const data = await makeExternalApiRequest(url);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

### News Endpoint Template
```javascript
router.get('/api/external/gnews/search', 
  gnewsRateLimit, 
  cacheMiddleware, 
  async (req, res) => {
    try {
      const { q, lang = 'en', max = 10 } = req.query;
      const apiKey = process.env.GNEWS_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'GNews API key not configured' });
      }

      if (!q) {
        return res.status(400).json({ error: 'Missing query parameter' });
      }

      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=${lang}&max=${max}&apikey=${apiKey}`;
      const data = await makeExternalApiRequest(url);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

## 🎯 Smart Provider Selection System

The backend already has a fallback system in [`backend/src/config/api-providers.js`](backend/src/config/api-providers.js):

### How Fallbacks Work
1. Try primary provider (Massive)
2. If fails/rate limited → try Alpha Vantage
3. If fails → try Finnhub
4. If fails → try Twelve Data
5. Return error if all fail

### Adding to Fallback Chains
```javascript
fallbackChains: {
  stock_quote: ['massive', 'alphavantage', 'finnhub', 'twelvedata', 'iexcloud'],
  // Add new provider here
}
```

## 📊 Monitoring & Optimization

### 1. **Track API Usage**
```javascript
// In rate-limit-service.js
console.log(`API ${apiName}: ${currentCount}/${limit} requests`);
```

### 2. **Cache Performance**
- Check cache hit rates in logs
- Monitor response times (cache HIT vs MISS)
- Adjust TTL based on data volatility

### 3. **Cost Management**
- Stay within free tier limits
- Use caching to reduce API calls
- Schedule updates during off-peak hours

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### 1. **API Key Not Working**
- Verify key is correctly set in `.env`
- Check provider dashboard for key status
- Ensure no trailing whitespace

#### 2. **Rate Limit Errors**
- Implement exponential backoff
- Increase cache TTL
- Add more providers to fallback chain

#### 3. **Data Inconsistency**
- Cross-validate with multiple providers
- Implement data quality checks
- Log discrepancies for review

#### 4. **Slow Response Times**
- Check cache hit rates
- Consider adding CDN caching
- Optimize database queries

## 🚀 Production Ready Features

### Already Implemented:
- ✅ Rate limiting per provider
- ✅ Database-backed caching
- ✅ Fallback provider chains
- ✅ Cache invalidation
- ✅ Request logging

### To Add:
- [ ] API usage dashboard
- [ ] Automatic provider health checks
- [ ] Cost tracking per provider
- [ ] Data quality monitoring
- [ ] Alerting for API failures

## 📈 Scaling Strategy

### Phase 1: Current (Free Tiers)
- Use 5-7 free providers
- Cache aggressively (1-5 minute TTL)
- Serve 100-1000 users/day

### Phase 2: Growth (Mix Free/Paid)
- Add 1-2 paid providers for critical data
- Implement request queuing
- Serve 1,000-10,000 users/day

### Phase 3: Scale (Enterprise)
- Direct data feeds from exchanges
- Real-time WebSocket streams
- Serve 10,000+ users/day

## 🔐 Security Best Practices

1. **Never expose API keys in client code**
2. **Rotate keys periodically** (every 3-6 months)
3. **Use environment variables** for all secrets
4. **Implement IP whitelisting** where possible
5. **Monitor for unusual usage patterns**

## 📚 Additional Resources

- [API Providers Config](backend/src/config/api-providers.js)
- [Rate Limit Service](backend/src/services/rate-limit-service.js)
- [Cache Service](backend/src/services/cache-service.js)
- [External API Routes](backend/src/routes/external-apis.js)
- [Free Market Data APIs](backend/docs/free-market-data-apis.md)

## 🎯 Next Steps

1. **Immediate**: Add Twelve Data API (800 calls/day free)
2. **Short-term**: Implement API usage dashboard
3. **Medium-term**: Add data quality validation
4. **Long-term**: Build provider health monitoring

The system is designed to be extensible - new providers can be added in minutes following the templates above.