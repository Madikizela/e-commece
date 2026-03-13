# E-Commerce Application Deployment Guide

## 🚀 Production Deployment Checklist

### 1. Environment Setup

#### Required Environment Variables
Create a `.env` file or set these environment variables:

```bash
# Database Configuration
DB_CONNECTION_STRING=Host=your_db_host;Database=ecommerce_prod;Username=your_db_user;Password=your_secure_db_password

# Email Configuration (Gmail example)
# IMPORTANT: Without email configuration, the app will work but users won't receive notifications
# To set up Gmail: Enable 2FA, then generate App Password at https://myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your_business_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=your_business_email@gmail.com

# JWT Security
JWT_KEY=your_super_long_and_secure_jwt_secret_key_at_least_32_characters_long
JWT_ISSUER=YourCompanyAPI
JWT_AUDIENCE=YourCompanyClient

# Admin Account (for initial setup)
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your_very_secure_admin_password

# CORS Configuration (your frontend domains)
ALLOWED_ORIGINS=https://yourstore.com,https://www.yourstore.com,https://admin.yourstore.com
```

### 2. Database Setup

#### PostgreSQL Production Setup
```sql
-- Create production database
CREATE DATABASE ecommerce_prod;

-- Create dedicated user
CREATE USER ecommerce_user WITH PASSWORD 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ecommerce_prod TO ecommerce_user;
```

#### Run Migrations
```bash
cd backend
dotnet ef database update --environment Production
```

### 3. Backend Deployment

#### Option A: Docker Deployment
```dockerfile
# Create Dockerfile in backend folder
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["EcommerceAPI.csproj", "."]
RUN dotnet restore "./EcommerceAPI.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "EcommerceAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EcommerceAPI.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EcommerceAPI.dll"]
```

Build and run:
```bash
docker build -t ecommerce-api .
docker run -d -p 80:80 --env-file .env ecommerce-api
```

#### Option B: Direct Deployment
```bash
cd backend
dotnet publish -c Release -o ./publish
# Copy publish folder to your server
# Configure IIS or nginx to serve the application
```

### 4. Frontend Deployment

#### Build for Production
```bash
cd frontend-app
npm install
npm run build
```

#### Deploy to Static Hosting
- **Netlify**: Connect your GitHub repo and set build command to `npm run build`
- **Vercel**: Same as Netlify
- **AWS S3 + CloudFront**: Upload build folder to S3, configure CloudFront
- **Traditional Hosting**: Upload build folder contents to your web server

#### Environment Configuration
Update API URLs in your frontend:
```javascript
// In api.js, update API_URL for production
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.yourstore.com/api' 
  : 'http://localhost:5222/api';
```

### 5. Security Configuration

#### SSL/HTTPS Setup
- **Backend**: Configure SSL certificate in your hosting environment
- **Frontend**: Most static hosts provide SSL automatically
- **Database**: Use SSL connection strings

#### Security Headers
Add these to your web server configuration:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### 6. Performance Optimization

#### Backend Optimizations
- Enable response compression (already configured)
- Configure connection pooling
- Set up Redis for caching (optional)
- Configure logging levels for production

#### Frontend Optimizations
- Enable gzip compression on your web server
- Configure CDN for static assets
- Set up proper caching headers

### 7. Monitoring & Logging

#### Application Insights (Azure)
```bash
dotnet add package Microsoft.ApplicationInsights.AspNetCore
```

#### Logging Configuration
Update `appsettings.Production.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning",
      "EcommerceAPI": "Information"
    }
  }
}
```

### 8. Initial Admin Setup

After deployment, create your first admin user:
```bash
curl -X POST https://api.yourstore.com/api/auth/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@yourstore.com",
    "password": "YourSecurePassword123!"
  }'
```

### 9. Testing Production Deployment

#### Health Checks
- ✅ API responds at `/api/products`
- ✅ Database connection works
- ✅ Email sending works (test registration)
- ✅ Admin login works
- ✅ JWT authentication works
- ✅ CORS allows your frontend domain

#### Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Create test script
artillery quick --count 10 --num 5 https://api.yourstore.com/api/products
```

### 10. Backup Strategy

#### Database Backups
```bash
# Daily backup script
pg_dump -h your_host -U ecommerce_user ecommerce_prod > backup_$(date +%Y%m%d).sql
```

#### File Backups
- Product images
- Configuration files
- SSL certificates

### 11. Domain & DNS Configuration

#### DNS Records
```
A     api.yourstore.com     -> Your API server IP
CNAME www.yourstore.com     -> yourstore.com
CNAME yourstore.com         -> your-frontend-host.com
```

### 12. Post-Deployment Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] SSL certificates installed and working
- [ ] Admin user created successfully
- [ ] Email notifications working
- [ ] Frontend can communicate with API
- [ ] All CRUD operations working
- [ ] Payment integration tested (if applicable)
- [ ] Backup systems in place
- [ ] Monitoring and logging configured
- [ ] Performance testing completed

## 🔧 Troubleshooting Common Issues

### API Returns 500 Errors
- Check environment variables are set
- Verify database connection string
- Check application logs

### CORS Errors
- Verify ALLOWED_ORIGINS includes your frontend domain
- Check protocol (http vs https) matches

### Email Not Sending
- Verify email credentials
- Check if Gmail requires app-specific password
- Test SMTP connection

### Database Connection Issues
- Verify connection string format
- Check firewall rules
- Ensure database user has proper permissions

## 📞 Support

For deployment issues:
1. Check application logs first
2. Verify all environment variables
3. Test individual components (database, email, etc.)
4. Check network connectivity and firewall rules

Your e-commerce application is now production-ready with enterprise-level security and performance optimizations!