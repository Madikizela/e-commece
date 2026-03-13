# GitHub Secrets Setup Script
# Run this script to generate and display all required secrets

Write-Host "🔐 E-commerce Application - GitHub Secrets Generator" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Generate secure tokens
Write-Host "`n🔑 Generated Secure Tokens:" -ForegroundColor Yellow

$jwtSecret = -join ((1..64) | ForEach {[char]((65..90) + (97..122) + (48..57) + (33,35,36,37,38,42,43,45,61,63,64,94,95) | Get-Random)})
$apiToken = -join ((1..32) | ForEach {[char]((65..90) + (97..122) + (48..57) | Get-Random)})
$deploySecret = -join ((1..48) | ForEach {[char]((65..90) + (97..122) + (48..57) | Get-Random)})
$dbPassword = -join ((1..24) | ForEach {[char]((65..90) + (97..122) + (48..57) | Get-Random)})

Write-Host "JWT_SECRET_KEY=" -NoNewline -ForegroundColor Green
Write-Host $jwtSecret -ForegroundColor White

Write-Host "API_SECRET_TOKEN=" -NoNewline -ForegroundColor Green  
Write-Host $apiToken -ForegroundColor White

Write-Host "DEPLOYMENT_SECRET=" -NoNewline -ForegroundColor Green
Write-Host $deploySecret -ForegroundColor White

Write-Host "DB_PASSWORD=" -NoNewline -ForegroundColor Green
Write-Host $dbPassword -ForegroundColor White

# Database connections
Write-Host "`n📊 Database Connection Strings:" -ForegroundColor Yellow

Write-Host "DB_CONNECTION_DEV=" -NoNewline -ForegroundColor Green
Write-Host "Host=localhost;Database=ecommerce_dev;Username=postgres;Password=$dbPassword" -ForegroundColor White

Write-Host "DB_CONNECTION_STAGING=" -NoNewline -ForegroundColor Green
Write-Host "Host=staging-db;Database=ecommerce_staging;Username=postgres;Password=$dbPassword" -ForegroundColor White

Write-Host "DB_CONNECTION_PROD=" -NoNewline -ForegroundColor Green
Write-Host "Host=prod-db;Database=ecommerce_prod;Username=postgres;Password=$dbPassword" -ForegroundColor White

# Email configuration
Write-Host "`n📧 Email Configuration:" -ForegroundColor Yellow
Write-Host "SMTP_HOST=" -NoNewline -ForegroundColor Green
Write-Host "smtp.gmail.com" -ForegroundColor White

Write-Host "SMTP_PORT=" -NoNewline -ForegroundColor Green
Write-Host "587" -ForegroundColor White

Write-Host "SMTP_USERNAME=" -NoNewline -ForegroundColor Green
Write-Host "your-email@gmail.com" -ForegroundColor White

Write-Host "SMTP_PASSWORD=" -NoNewline -ForegroundColor Green
Write-Host "your-gmail-app-password" -ForegroundColor White

Write-Host "EMAIL_FROM=" -NoNewline -ForegroundColor Green
Write-Host "your-email@gmail.com" -ForegroundColor White

# Environment URLs
Write-Host "`n🌐 Environment URLs:" -ForegroundColor Yellow
Write-Host "FRONTEND_URL_DEV=" -NoNewline -ForegroundColor Green
Write-Host "http://localhost:3000" -ForegroundColor White

Write-Host "BACKEND_URL_DEV=" -NoNewline -ForegroundColor Green
Write-Host "http://localhost:5222" -ForegroundColor White

Write-Host "FRONTEND_URL_STAGING=" -NoNewline -ForegroundColor Green
Write-Host "https://staging.yourdomain.com" -ForegroundColor White

Write-Host "BACKEND_URL_STAGING=" -NoNewline -ForegroundColor Green
Write-Host "https://api-staging.yourdomain.com" -ForegroundColor White

Write-Host "FRONTEND_URL_PROD=" -NoNewline -ForegroundColor Green
Write-Host "https://yourdomain.com" -ForegroundColor White

Write-Host "BACKEND_URL_PROD=" -NoNewline -ForegroundColor Green
Write-Host "https://api.yourdomain.com" -ForegroundColor White

# Instructions
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Go to GitHub Repository → Settings → Secrets and variables → Actions" -ForegroundColor Cyan
Write-Host "2. Click 'New repository secret' for each secret above" -ForegroundColor Cyan
Write-Host "3. Copy the name and value exactly as shown" -ForegroundColor Cyan
Write-Host "4. Update your domain names in the URL secrets" -ForegroundColor Cyan
Write-Host "5. Replace email settings with your actual Gmail credentials" -ForegroundColor Cyan

Write-Host "`n⚠️  Security Note:" -ForegroundColor Red
Write-Host "Keep these tokens secure and never commit them to your repository!" -ForegroundColor Red

Write-Host "`n✅ Setup complete! Your secrets are ready for GitHub Actions." -ForegroundColor Green