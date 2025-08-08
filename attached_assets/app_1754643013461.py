
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

openai.api_key = os.getenv("OPENAI_API_KEY")
model = joblib.load("ml_strategy_model.pkl")

@app.route("/strategy-suggestion", methods=["POST"])
def strategy_suggestion():
    data = request.get_json()
    symbol = data.get("symbol", "BTCUSDT")
    current = data.get("currentStrategy", "")
    btc_change = float(data.get("btc_change", 0))
    eth_change = float(data.get("eth_change", 0))

    # GPT suggestion
    gpt_prompt = f"Suggest a trading strategy for {symbol}. BTC change: {btc_change}%, ETH change: {eth_change}%. Current strategy: {current}"
    gpt_response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a crypto trading expert."},
            {"role": "user", "content": gpt_prompt}
        ]
    )
    ai_strategy = gpt_response['choices'][0]['message']['content']

    # ML prediction
    X = [[btc_change, eth_change]]
    prediction = model.predict(X)[0]
    confidence = max(model.predict_proba(X)[0])

    return jsonify({
        "ai_strategy": ai_strategy,
        "ml_prediction": prediction,
        "confidence": round(float(confidence), 2)
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
