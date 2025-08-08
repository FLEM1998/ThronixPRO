from flask import Flask, request, jsonify
import os
import requests

app = Flask(__name__)

HUAWEI_APP_ID = os.getenv("HUAWEI_APP_ID")
HUAWEI_APP_SECRET = os.getenv("HUAWEI_APP_SECRET")

# Endpoint to exchange client credentials for access token
TOKEN_ENDPOINT = "https://oauth-login.cloud.huawei.com/oauth2/v3/token"
SUBSCRIPTION_VERIFY_ENDPOINT = "https://subscr-drcn.iap.hicloud.com/sub/applications/v2/purchases/get"

def get_access_token():
    data = {
        "grant_type": "client_credentials",
        "client_id": HUAWEI_APP_ID,
        "client_secret": HUAWEI_APP_SECRET
    }
    resp = requests.post(TOKEN_ENDPOINT, data=data)
    return resp.json().get("access_token")

@app.route("/verify-huawei-subscription", methods=["POST"])
def verify_huawei_subscription():
    body = request.get_json()
    purchase_token = body.get("purchaseToken")
    product_id = body.get("productId")
    user_id = body.get("userId")

    if not purchase_token or not product_id:
        return jsonify({"error": "Missing purchaseToken or productId"}), 400

    access_token = get_access_token()
    if not access_token:
        return jsonify({"error": "Failed to obtain Huawei access token"}), 500

    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {
        "purchaseToken": purchase_token,
        "productId": product_id,
        "packageName": HUAWEI_APP_ID
    }

    r = requests.post(SUBSCRIPTION_VERIFY_ENDPOINT, json=payload, headers=headers)
    data = r.json()

    # Check if subscription is valid
    if data.get("purchaseState") == 0:
        return jsonify({
            "status": "active",
            "userId": user_id,
            "productId": product_id,
            "expiryTime": data.get("expiryTimeMillis")
        })
    else:
        return jsonify({"status": "inactive", "reason": data}), 403

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)