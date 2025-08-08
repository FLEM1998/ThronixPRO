# ThronixPRO Mobile IAP Services

Complete in-app purchase verification microservices for mobile app monetization across major app stores.

## Services Overview

### Huawei AppGallery Service (Port 5002)
- OAuth2 integration with Huawei Cloud
- Real-time subscription verification
- Production-ready authentication
- Purchase token validation

### Samsung Galaxy Store Service (Port 5003)
- Subscription verification framework
- Purchase validation system
- Extensible for full Samsung IAP SDK
- Development and production support

## Quick Start

### Docker Deployment
```bash
# Start all services
docker-compose -f ../docker-compose.full.yml up

# Individual services
docker build -t huawei-iap ./huawei && docker run -p 5002:5002 huawei-iap
docker build -t samsung-iap ./samsung && docker run -p 5003:5003 samsung-iap
```

### Local Development
```bash
# Huawei service
cd huawei
pip install -r requirements.txt
python app.py

# Samsung service  
cd samsung
pip install -r requirements.txt
python app.py
```

## API Documentation

### Huawei Verification
```http
POST http://localhost:5002/verify-huawei-subscription
Content-Type: application/json

{
  "userId": "user123",
  "purchaseToken": "huawei_purchase_token",
  "productId": "premium_subscription"
}
```

### Samsung Verification
```http
POST http://localhost:5003/verify-samsung-subscription
Content-Type: application/json

{
  "userId": "user123",
  "purchaseId": "samsung_purchase_id", 
  "itemId": "premium_monthly"
}
```

## Environment Configuration

### Huawei (.env)
```bash
HUAWEI_APP_ID=your_huawei_app_id
HUAWEI_APP_SECRET=your_huawei_app_secret
```

### Samsung
No additional environment variables required for basic setup.

## Production Deployment

Both services include Render.com deployment configurations:
- `huawei/render.yaml` - Huawei service deployment
- `samsung/render.yaml` - Samsung service deployment

## Integration

These services integrate with the main ThronixPRO platform through the IAP service layer (`../server/iap-service.ts`), providing:
- Multi-store subscription verification
- User access level management
- Revenue tracking capabilities
- Health monitoring across all services

## Business Value

- **Global Market Access**: Support for major Asian app stores
- **Revenue Streams**: Subscription-based premium features
- **Scalable Architecture**: Independent microservice deployment
- **Production Ready**: Enterprise-grade authentication and validation