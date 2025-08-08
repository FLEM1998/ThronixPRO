
from flask import Flask, request, jsonify
import os
from datetime import datetime, timedelta

app = Flask(__name__)

# Simulated backend check (Samsung typically requires native validation or server-side signature validation)
@app.route("/verify-samsung-subscription", methods=["POST"])
def verify_samsung_subscription():
    data = request.get_json()
    user_id = data.get("userId")
    purchase_id = data.get("purchaseId")
    item_id = data.get("itemId")

    if not purchase_id or not item_id:
        return jsonify({ "error": "Missing purchaseId or itemId" }), 400

    # In real implementation, you validate using Samsung's Java SDK or your app server
    # For now, simulate success
    fake_expiry = datetime.utcnow() + timedelta(days=30)

    return jsonify({
        "status": "active",
        "userId": user_id,
        "productId": item_id,
        "expiryTime": fake_expiry.isoformat() + "Z"
    })

@app.route("/health")
def health():
    return jsonify({ "status": "ok" })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
