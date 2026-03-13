# GitHub Secrets Configuration for CI/CD Pipeline

## 🔐 Required Secrets for Your Repository

Add these secrets to your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

### 🔑 Generated Secure Tokens

#### JWT Secret Key
```
JWT_SECRET_KEY=Zs4SBzNTN$?O$H-MT4VtusY=RxyhWKeEqatIR4lY%oZ8?c49sWe9A=v1Ze?4UE3p
```

#### API Secret Token
```
API_SECRET_TOKEN=4XHgPLttDYIiQ1RPv08E5ANv6I8iZ473
```

#### Deployment Secret
```
DEPLOYMENT_SECRET=Jk7ztbq7O1PK62LPxpDNXD3OriicDVjTlepntrZ3zsuPwi9r
```

### 📊 Database Connection Strings

#### Development Database
```
DB_CONNECTION_DEV=Host=localhost;Database=ecommerce_dev;Username=your_user;Password=your_password
```

#### Staging Database  
```
DB_CONNECTION_STAGING=Host=staging-db-host;Database=ecommerce_staging;Username=staging_user;Password=staging_password
```

#### Production Database
```
DB_CONNECTION_PROD=Host=prod-db-host;Database=ecommerce_prod;Username=prod_user;Password=prod_password
```

### 📧 Email Configuration

#### SMTP Settings
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 🐳 Docker Registry

#### GitHub Container Registry (already configured in workflow)
```
REGISTRY_USERNAME=${{ github.actor }}
REGISTRY_PASSWORD=${{ secrets.GITHUB_TOKEN }}
```

### ☁️ Cloud Provider Secrets (if using)

#### AWS (if deploying to AWS)
```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
```

#### Azure (if deploying to Azure)
```
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id
```

#### Google Cloud (if deploying to GCP)
```
GCP_PROJECT_ID=your-project-id
GCP_SERVICE_ACCOUNT_KEY=your-service-account-json
```

### 🔧 Application Configuration

#### Environment-Specific Settings
```
# Development
FRONTEND_URL_DEV=http://localhost:3000
BACKEND_URL_DEV=http://localhost:5222

# Staging
FRONTEND_URL_STAGING=https://staging.yourdomain.com
BACKEND_URL_STAGING=https://api-staging.yourdomain.com

# Production
FRONTEND_URL_PROD=https://yourdomain.com
BACKEND_URL_PROD=https://api.yourdomain.com
```

#### Security Settings
```
CORS_ORIGINS=https://yourdomain.com,https://staging.yourdomain.com
ALLOWED_HOSTS=yourdomain.com,staging.yourdomain.com,localhost
```

## 📋 How to Add Secrets to GitHub

### Step 1: Navigate to Repository Settings
1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**

### Step 2: Add Each Secret
1. Click **New repository secret**
2. Enter the **Name** (e.g., `JWT_SECRET_KEY`)
3. Enter the **Value** (e.g., the generated token)
4. Click **Add secret**

### Step 3: Verify Secrets
- Secrets will appear in the list but values are hidden
- You can update or delete secrets as needed

## 🔄 Using Secrets in GitHub Actions

The secrets are already configured in your `.github/workflows/ci-cd.yml` file:

```yaml
env:
  JWT_SECRET_KEY: ${{ secrets.JWT_SECRET_KEY }}
  DB_CONNECTION: ${{ secrets.DB_CONNECTION_PROD }}
  SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
```

## 🛡️ Security Best Practices

### ✅ Do's
- **Rotate secrets regularly** (every 90 days)
- **Use different secrets** for each environment
- **Limit secret access** to necessary workflows only
- **Use strong, unique passwords** for all services
- **Enable 2FA** on all accounts

### ❌ Don'ts
- **Never commit secrets** to your repository
- **Don't share secrets** in plain text
- **Don't use the same secret** across environments
- **Don't log secret values** in your applications

## 🔧 Environment Variables in Applications

### Backend (.NET)
Update your `appsettings.json` to use environment variables:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "${DB_CONNECTION}"
  },
  "JwtSettings": {
    "SecretKey": "${JWT_SECRET_KEY}",
    "Issuer": "EcommerceAPI",
    "Audience": "EcommerceUsers",
    "ExpiryMinutes": 60
  },
  "EmailSettings": {
    "SmtpHost": "${SMTP_HOST}",
    "SmtpPort": "${SMTP_PORT}",
    "SmtpUsername": "${SMTP_USERNAME}",
    "SmtpPassword": "${SMTP_PASSWORD}",
    "FromEmail": "${EMAIL_FROM}"
  }
}
```

### Frontend (React)
Environment variables in `.env` files:

```bash
# .env.production
VITE_API_URL=${BACKEND_URL_PROD}
VITE_APP_NAME=E-commerce Store

# .env.staging  
VITE_API_URL=${BACKEND_URL_STAGING}
VITE_APP_NAME=E-commerce Store (Staging)

# .env.development
VITE_API_URL=${BACKEND_URL_DEV}
VITE_APP_NAME=E-commerce Store (Dev)
```

## 🚀 Deployment Verification

After adding secrets, test your pipeline:

1. **Push to development branch** - should deploy to dev environment
2. **Push to staging branch** - should deploy to staging environment  
3. **Push to main branch** - should deploy to production environment

Monitor the **Actions** tab in GitHub to see if deployments succeed.

## 🆘 Troubleshooting

### Secret Not Found Error
- Verify secret name matches exactly (case-sensitive)
- Check if secret is added to the correct repository
- Ensure workflow has access to the secret

### Connection Failures
- Verify database connection strings are correct
- Check firewall rules allow connections
- Ensure credentials have proper permissions

### Email Issues
- Verify SMTP settings are correct
- Check if app password is generated (for Gmail)
- Test email configuration locally first

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are properly configured
3. Test individual components locally
4. Review the deployment logs for specific failures

---

**⚠️ Important**: Keep these tokens secure and never share them publicly. Regenerate immediately if compromised.