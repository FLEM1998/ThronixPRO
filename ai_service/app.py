from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)

def get_live_market_data():
    """Fetch live market data from main trading platform"""
    try:
        # Connect to the main platform's market data
        response = requests.get('http://localhost:5000/api/market/overview', timeout=5)
        if response.status_code == 200:
            return response.json()
    except:
        pass
    return None

@app.route('/strategy-suggestion', methods=['POST'])
def strategy_suggestion():
    data = request.get_json()
    symbol = data.get('symbol', 'BTCUSDT')
    current = data.get('currentStrategy', '')
    
    # Get live market data for intelligent suggestions
    market_data = get_live_market_data()
    
    if market_data:
        btc_change = market_data.get('btc', {}).get('change', 0)
        eth_change = market_data.get('eth', {}).get('change', 0)
        volatility = (abs(btc_change) + abs(eth_change)) / 2
        
        if volatility > 3:
            suggestions = [
                f"High volatility ({volatility:.1f}%) detected - scalping strategy recommended for {symbol}",
                "Grid trading with tight ranges for quick profits",
                "Momentum trading with trailing stops due to high movement"
            ]
        elif volatility > 1:
            suggestions = [
                f"Moderate volatility ({volatility:.1f}%) - swing trading optimal for {symbol}",
                "DCA strategy with weekly intervals",
                "Support/resistance trading at key levels"
            ]
        else:
            suggestions = [
                f"Low volatility ({volatility:.1f}%) - accumulation strategy for {symbol}",
                "Wide grid trading setups for stable conditions",
                "Long-term holding with systematic DCA"
            ]
    else:
        # Fallback when live data unavailable
        suggestions = [
            "Connect live market data for intelligent strategy analysis",
            "Consider DCA strategy for systematic accumulation",
            "Monitor support/resistance levels for entry points"
        ]
    
    return jsonify({
        'suggestions': suggestions,
        'source': 'live_analysis' if market_data else 'general_guidance'
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').lower()
    
    # Get live market data for context-aware responses
    market_data = get_live_market_data()
    
    if market_data:
        btc_price = market_data.get('btc', {}).get('price', 0)
        btc_change = market_data.get('btc', {}).get('change', 0)
        trend = 'bullish' if btc_change > 0 else 'bearish' if btc_change < 0 else 'neutral'
        
        if "hello" in message or "hi" in message:
            reply = f"Hello! I'm analyzing live market data. BTC is ${btc_price:,} with {trend} sentiment. How can I help your trading?"
        elif "btc" in message or "bitcoin" in message:
            reply = f"Bitcoin is at ${btc_price:,} with {btc_change:.2f}% change. Market shows {trend} conditions. Consider {'momentum strategies' if abs(btc_change) > 2 else 'accumulation strategies'}."
        elif "strategy" in message:
            volatility = abs(btc_change)
            if volatility > 3:
                reply = f"High volatility detected ({volatility:.1f}%). Recommended: scalping, grid trading, momentum strategies with tight risk management."
            else:
                reply = f"Moderate volatility ({volatility:.1f}%). Good for: swing trading, DCA, support/resistance strategies."
        elif "price" in message or "prediction" in message:
            reply = f"Live analysis shows {trend} conditions. BTC at ${btc_price:,} ({btc_change:.2f}%). Technical indicators suggest {'continued momentum' if abs(btc_change) > 1 else 'consolidation phase'}."
        else:
            reply = f"I provide live market analysis. Current: BTC ${btc_price:,} ({btc_change:.2f}%). Ask about strategies, prices, or specific cryptocurrencies."
    else:
        # Fallback responses
        if "hello" in message or "hi" in message:
            reply = "Hello! I provide AI trading assistance with live market analysis. Connect exchange APIs for real-time insights."
        else:
            reply = "I analyze live market data for intelligent trading advice. Connect your trading platform for personalized recommendations."

    return jsonify({
        'reply': reply,
        'source': 'live_analysis' if market_data else 'general_guidance'
    })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True)