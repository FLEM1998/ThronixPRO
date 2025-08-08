# ThronixPRO AI Strategy Engine

This microservice powers GPT-based strategy generation and ML-driven predictions for the ThronixPRO trading app.

## 🚀 Endpoints

### POST /strategy-suggestion
Input:
```json
{
  "symbol": "BTCUSDT",
  "currentStrategy": "Hold",
  "btc_change": 1.2,
  "eth_change": 0.8
}
```

Output:
```json
{
  "ai_strategy": "Based on BTC movement...",
  "ml_prediction": "Buy",
  "confidence": 0.91
}
```

### GET /health
Check service status.

## 📦 Setup
```bash
pip install -r requirements.txt
python model_trainer.py
python app.py
```