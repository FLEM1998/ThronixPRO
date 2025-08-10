from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
import joblib
import psycopg2
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Initialize OpenAI API key using environment variable.
openai.api_key = os.getenv("OPENAI_API_KEY")

DATABASE_URL = os.getenv("DATABASE_URL")
# Load the machine learning model for strategy predictions.
model = joblib.load("ml_strategy_model.pkl")

# Monthly usage limit in USD for each user. Defaults to 10 USD if not provided.
MONTHLY_LIMIT_USD = float(os.getenv("AI_MONTHLY_LIMIT_USD", "10.0"))

# Default OpenAI model to use for strategy generation. This can be overridden via env var.
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5-nano")

# Pricing (USD per token) for different models. Prices are per million tokens.
# See OpenAI pricing docs for up-to-date values.
PRICES = {
    "gpt-5-nano": {"in": 0.05 / 1_000_000, "out": 0.40 / 1_000_000},
    "gpt-5-mini": {"in": 0.25 / 1_000_000, "out": 2.00 / 1_000_000},
    "gpt-3.5-turbo": {"in": 0.50 / 1_000_000, "out": 1.50 / 1_000_000},
}

def calculate_openai_cost(tokens_in: int, tokens_out: int, model_name: str) -> float:
    """
    Compute the cost in USD for a given number of input and output tokens
    based on the model's pricing. Defaults to zero if model is unknown.
    """
    rates = PRICES.get(model_name)
    if not rates:
        return 0.0
    return tokens_in * rates["in"] + tokens_out * rates["out"]

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

    # Initialize or load usage data for the user.
    init_user_usage(user_id)
    usage = get_usage(user_id)
    usage = reset_if_needed(user_id, usage)

    # Check monthly cost limit before making any API call.
    if usage["monthly_cost"] >= MONTHLY_LIMIT_USD:
        return jsonify({"error": "Monthly AI usage limit reached. Try again next month."}), 403

    # Compose the prompt for the AI model.
    gpt_prompt = (
        f"Suggest a trading strategy for {symbol}. "
        f"BTC change: {btc_change}%, ETH change: {eth_change}%. "
        f"Current strategy: {current}"
    )

    # Create an OpenAI client. We explicitly use the OpenAI SDK to obtain token usage info.
    from openai import OpenAI  # imported here to avoid circular import issues
    client = OpenAI(api_key=openai.api_key)

    # Call the OpenAI chat completion API with the selected model.
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are a crypto trading expert."},
            {"role": "user", "content": gpt_prompt},
        ],
    )

    ai_strategy = response.choices[0].message.content

    # Machine learning prediction using our local model.
    X = [[btc_change, eth_change]]
    prediction = model.predict(X)[0]
    confidence = max(model.predict_proba(X)[0])

    # Calculate actual token usage and cost.
    usage_obj = getattr(response, "usage", None) or {}
    tokens_in = getattr(usage_obj, "prompt_tokens", None) or 0
    tokens_out = getattr(usage_obj, "completion_tokens", None) or 0
    total_tokens = tokens_in + tokens_out
    cost = calculate_openai_cost(tokens_in, tokens_out, OPENAI_MODEL)

    # Update usage in the database.
    update_usage(user_id, total_tokens, cost)

    # Update local usage dictionary for return.
    usage["token_count"] += total_tokens
    usage["monthly_cost"] += cost

    return jsonify({
        "ai_strategy": ai_strategy,
        "ml_prediction": prediction,
        "confidence": round(float(confidence), 2),
        "usage": {
            "tokens_used": usage["token_count"],
            "cost_so_far": round(usage["monthly_cost"], 4),
            "reset_on": usage["reset_date"].strftime("%Y-%m-%d"),
        },
    })

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
