
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import joblib
import psycopg2
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

openai.api_key = os.getenv("OPENAI_API_KEY")

DATABASE_URL = os.getenv("DATABASE_URL")
model = joblib.load("ml_strategy_model.pkl")

MONTHLY_LIMIT_USD = 10.00
COST_PER_TOKEN = 0.00001
TOKEN_ESTIMATE_PER_REQUEST = 1000

def get_db_conn():
    return psycopg2.connect(DATABASE_URL, sslmode='require')

def init_user_usage(user_id):
    now = datetime.utcnow()
    reset_date = now + timedelta(days=30)
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO ai_usage (user_id, token_count, monthly_cost, reset_date) VALUES (%s, %s, %s, %s) ON CONFLICT (user_id) DO NOTHING",
                (user_id, 0, 0.0, reset_date)
            )
            conn.commit()

def get_usage(user_id):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT token_count, monthly_cost, reset_date FROM ai_usage WHERE user_id = %s", (user_id,))
            result = cur.fetchone()
            if result:
                return {"token_count": result[0], "monthly_cost": float(result[1]), "reset_date": result[2]}
    return None

def update_usage(user_id, tokens, cost):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE ai_usage SET token_count = token_count + %s, monthly_cost = monthly_cost + %s WHERE user_id = %s",
                (tokens, cost, user_id)
            )
            conn.commit()

def reset_if_needed(user_id, usage):
    now = datetime.utcnow()
    if now >= usage['reset_date']:
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                new_reset = now + timedelta(days=30)
                cur.execute(
                    "UPDATE ai_usage SET token_count = 0, monthly_cost = 0, reset_date = %s WHERE user_id = %s",
                    (new_reset, user_id)
                )
                conn.commit()
            usage["token_count"] = 0
            usage["monthly_cost"] = 0.0
            usage["reset_date"] = new_reset
    return usage

@app.route("/strategy-suggestion", methods=["POST"])
def strategy_suggestion():
    data = request.get_json()
    user_id = data.get("user_id", "default_user")
    symbol = data.get("symbol", "BTCUSDT")
    current = data.get("currentStrategy", "")
    btc_change = float(data.get("btc_change", 0))
    eth_change = float(data.get("eth_change", 0))

    init_user_usage(user_id)
    usage = get_usage(user_id)
    usage = reset_if_needed(user_id, usage)

    if usage["monthly_cost"] >= MONTHLY_LIMIT_USD:
        return jsonify({"error": "Monthly AI usage limit reached. Try again next month."}), 403

    gpt_prompt = f"Suggest a trading strategy for {symbol}. BTC change: {btc_change}%, ETH change: {eth_change}%. Current strategy: {current}"
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are a crypto trading expert."},
            {"role": "user", "content": gpt_prompt}
        ]
    )
    ai_strategy = response['choices'][0]['message']['content']

    X = [[btc_change, eth_change]]
    prediction = model.predict(X)[0]
    confidence = max(model.predict_proba(X)[0])

    estimated_cost = TOKEN_ESTIMATE_PER_REQUEST * COST_PER_TOKEN
    update_usage(user_id, TOKEN_ESTIMATE_PER_REQUEST, estimated_cost)

    usage["token_count"] += TOKEN_ESTIMATE_PER_REQUEST
    usage["monthly_cost"] += estimated_cost

    return jsonify({
        "ai_strategy": ai_strategy,
        "ml_prediction": prediction,
        "confidence": round(float(confidence), 2),
        "usage": {
            "tokens_used": usage["token_count"],
            "cost_so_far": round(usage["monthly_cost"], 4),
            "reset_on": usage["reset_date"].strftime("%Y-%m-%d")
        }
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
