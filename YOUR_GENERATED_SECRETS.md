# 🔐 Your Generated Secrets - KEEP SECURE!

## ⚠️ IMPORTANT: Delete this file after copying secrets to GitHub!

### 🔑 Primary Secrets (Copy these to GitHub)

```
JWT_SECRET_KEY=Zs4SBzNTN$?O$H-MT4VtusY=RxyhWKeEqatIR4lY%oZ8?c49sWe9A=v1Ze?4UE3p
API_SECRET_TOKEN=4XHgPLttDYIiQ1RPv08E5ANv6I8iZ473
DEPLOYMENT_SECRET=Jk7ztbq7O1PK62LPxpDNXD3OriicDVjTlepntrZ3zsuPwi9r
```

### 📊 Database Connections (Update with your actual database details)

```
DB_CONNECTION_DEV=Host=localhost;Database=ecommerce_dev;Username=postgres;Password=SecurePass123!
DB_CONNECTION_STAGING=Host=your-staging-db;Database=ecommerce_staging;Username=postgres;Password=SecurePass123!
DB_CONNECTION_PROD=Host=your-prod-db;Database=ecommerce_prod;Username=postgres;Password=SecurePass123!
```

### 📧 Email Settings (Update with your Gmail details)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
```

### 🌐 Environment URLs (Update with your actual domains)

```
FRONTEND_URL_DEV=http://localhost:3000
BACKEND_URL_DEV=http://localhost:5222
FRONTEND_URL_STAGING=https://staging.yourdomain.com
BACKEND_URL_STAGING=https://api-staging.yourdomain.com
FRONTEND_URL_PROD=https://yourdomain.com
BACKEND_URL_PROD=https://api.yourdomain.com
```

## 📋 Quick Setup Steps:

1. **Go to GitHub**: Repository → Settings → Secrets and variables → Actions
2. **Add each secret**: Click "New repository secret"
3. **Copy name and value**: Exactly as shown above
4. **Update placeholders**: Replace "yourdomain.com" and email details
5. **Delete this file**: After copying all secrets

## 🔄 Test Your Setup:

After adding secrets, test by pushing to different branches:
- Push to `development` → Triggers dev deployment
- Push to `staging` → Triggers staging deployment  
- Push to `main` → Triggers production deployment

---

**🚨 SECURITY WARNING**: This file contains sensitive information. Delete it immediately after use!