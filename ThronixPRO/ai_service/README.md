# ThronixPRO AI Strategy Engine

This advanced microservice powers GPT-4 strategy generation, ML predictions, and usage tracking for the ThronixPRO trading platform.

## ✨ Features

- **GPT-4 Strategy Generation** - Context-aware trading advice
- **Machine Learning Predictions** - Random Forest buy/sell/hold signals with confidence scores
- **Usage Tracking** - Per-user cost monitoring with $10/month limits
- **Database Integration** - PostgreSQL for persistent usage data
- **Production Ready** - Error handling, rate limiting, and monitoring

## 🚀 API Endpoints

### POST /strategy-suggestion
Request:
```json
{
  "user_id": "user123",
  "symbol": "BTCUSDT", 
  "currentStrategy": "Hold",
  "btc_change": 1.2,
  "eth_change": 0.8
}
```

Response:
```json
{
  "ai_strategy": "Based on current market conditions with BTC up 1.2%...",
  "ml_prediction": "Buy",
  "confidence": 0.91,
  "usage": {
    "tokens_used": 1000,
    "cost_so_far": 0.0100,
    "reset_on": "2025-09-08"
  }
}
```

### GET /health
Health check endpoint.

## 💰 Cost Management

- **Monthly Limit**: $10 per user
- **Token Cost**: $0.00001 per token
- **Usage Tracking**: Automatic database logging
- **Reset Cycle**: 30-day rolling periods

## 🛠 Setup & Deployment

### Local Development
```bash
cd ai_service
chmod +x start-ai-service.sh
./start-ai-service.sh
```

### Environment Variables
```bash
OPENAI_API_KEY=sk-your-openai-key
DATABASE_URL=postgresql://user:pass@host:port/dbname
```

### Docker Deployment
```bash
docker build -t thronixpro-ai .
docker run -p 5001:5001 -e OPENAI_API_KEY=sk-... -e DATABASE_URL=... thronixpro-ai
```

### Render.com Deployment
Use the included `render.yaml` configuration for one-click deployment.

## 🔧 Database Schema

```sql
CREATE TABLE ai_usage (
    user_id TEXT PRIMARY KEY,
    token_count INTEGER NOT NULL DEFAULT 0,
    monthly_cost FLOAT NOT NULL DEFAULT 0.0,
    reset_date TIMESTAMP NOT NULL
);
```

## 🎯 Integration

This service integrates seamlessly with the main ThronixPRO platform, providing enhanced AI capabilities while maintaining system stability through fallback mechanisms.