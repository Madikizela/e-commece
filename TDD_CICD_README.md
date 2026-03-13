# E-Commerce Application - TDD & CI/CD Implementation

This document outlines the Test-Driven Development (TDD) and Continuous Integration/Continuous Deployment (CI/CD) implementation for the E-Commerce application.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging     │    │   Production    │
│                 │    │                 │    │                 │
│ • Local Testing │    │ • Integration   │    │ • Live System   │
│ • Unit Tests    │    │ • E2E Tests     │    │ • Monitoring    │
│ • Code Review   │    │ • Performance   │    │ • Scaling       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  GitHub Actions │
                    │                 │
                    │ • Automated     │
                    │   Testing       │
                    │ • Docker Build  │
                    │ • Deployment    │
                    └─────────────────┘
```

## 🧪 Test-Driven Development (TDD)

### Backend Testing (.NET)

#### Test Structure
```
backend/
├── EcommerceAPI.Tests/
│   ├── Controllers/
│   │   ├── ProductsControllerTests.cs
│   │   ├── OrdersControllerTests.cs
│   │   └── UsersControllerTests.cs
│   ├── Integration/
│   │   ├── ProductsIntegrationTests.cs
│   │   └── OrdersIntegrationTests.cs
│   └── Services/
│       ├── EmailServiceTests.cs
│       └── JwtServiceTests.cs
```

#### Running Backend Tests
```bash
# Run all tests
cd backend
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test class
dotnet test --filter "ProductsControllerTests"

# Run tests in watch mode
dotnet watch test
```

#### Test Categories
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test API endpoints with in-memory database
- **Service Tests**: Test business logic and external integrations

### Frontend Testing (React/TypeScript)

#### Test Structure
```
frontend-app/
├── src/
│   └── test/
│       ├── components/
│       │   ├── ProductCard.test.tsx
│       │   ├── Cart.test.tsx
│       │   └── Navigation.test.tsx
│       ├── services/
│       │   ├── api.test.ts
│       │   └── auth.test.ts
│       ├── utils/
│       │   └── helpers.test.ts
│       └── setup.ts
```

#### Running Frontend Tests
```bash
# Run all tests
cd frontend-app
npm test

# Run with coverage
npm run coverage

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui
```

#### Test Types
- **Component Tests**: Test React components with React Testing Library
- **Service Tests**: Test API calls and business logic
- **Integration Tests**: Test user workflows and interactions

## 🚀 CI/CD Pipeline

### Branch Strategy

```
main (production)
├── staging
└── development
    ├── feature/user-authentication
    ├── feature/payment-integration
    └── bugfix/cart-calculation
```

#### Branch Policies
- **main**: Production-ready code, requires PR approval
- **staging**: Pre-production testing, auto-deploys to staging environment
- **development**: Integration branch, auto-deploys to development environment
- **feature/***: Feature branches, require tests to pass before merge

### GitHub Actions Workflow

#### Trigger Events
```yaml
on:
  push:
    branches: [ main, development, staging ]
  pull_request:
    branches: [ main, development, staging ]
```

#### Pipeline Stages

1. **Test Stage**
   - Backend unit tests with PostgreSQL
   - Frontend unit tests with coverage
   - Code quality checks (linting, formatting)

2. **Build Stage**
   - Docker image builds for backend and frontend
   - Push to GitHub Container Registry
   - Tag with branch name and commit hash

3. **Deploy Stage**
   - Development: Auto-deploy on push to `development`
   - Staging: Auto-deploy on push to `staging`
   - Production: Auto-deploy on push to `main`

### Environment Configuration

#### Development Environment
```bash
# Start development environment
docker-compose up -d

# Or use deployment script
./scripts/deploy.sh development
```

**Features:**
- Hot reload for both backend and frontend
- In-memory database for testing
- Debug logging enabled
- No authentication required for some endpoints

#### Staging Environment
```bash
# Deploy to staging
./scripts/deploy.sh staging
```

**Features:**
- Production-like environment
- Persistent database
- Performance monitoring
- Integration testing
- Security testing

#### Production Environment
```bash
# Deploy to production
./scripts/deploy.sh production
```

**Features:**
- High availability with multiple replicas
- Load balancing with Nginx
- SSL/TLS encryption
- Monitoring and alerting
- Automated backups

## 🐳 Docker Configuration

### Multi-Stage Builds

#### Backend Dockerfile
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
# ... build steps

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
# ... runtime configuration
```

#### Frontend Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine AS build
# ... build steps

# Production stage with Nginx
FROM nginx:alpine AS runtime
# ... nginx configuration
```

### Health Checks

All services include health checks:
- **Backend**: `/health`, `/health/ready`, `/health/live`
- **Frontend**: `/health` (nginx status)
- **Database**: `pg_isready`
- **Redis**: `redis-cli ping`

## 📊 Monitoring and Observability

### Health Endpoints

#### Backend Health Check
```http
GET /health
{
  "status": "Healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "Production",
  "database": "Connected",
  "uptime": 3600000
}
```

#### Readiness Check
```http
GET /health/ready
{
  "status": "Ready"
}
```

#### Liveness Check
```http
GET /health/live
{
  "status": "Alive",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔧 Development Workflow

### TDD Workflow

1. **Write a Failing Test**
   ```bash
   # Create test first
   dotnet test # Should fail
   ```

2. **Write Minimal Code**
   ```bash
   # Implement just enough to pass
   dotnet test # Should pass
   ```

3. **Refactor**
   ```bash
   # Improve code quality
   dotnet test # Should still pass
   ```

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Write Tests & Code**
   ```bash
   # TDD cycle
   git add .
   git commit -m "Add failing test for new feature"
   git commit -m "Implement new feature"
   git commit -m "Refactor implementation"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/new-feature
   # Create PR to development branch
   ```

4. **Automated Checks**
   - Tests run automatically
   - Code coverage checked
   - Security scan performed
   - Build verification

5. **Merge and Deploy**
   - PR approved and merged
   - Automatic deployment to development
   - Manual promotion to staging/production

## 🚀 Deployment Commands

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd e-commerce-app

# Start development environment
docker-compose up -d

# Run tests
./scripts/deploy.sh development
```

### Environment Deployment
```bash
# Development
./scripts/deploy.sh development

# Staging
./scripts/deploy.sh staging

# Production
./scripts/deploy.sh production
```

### Manual Docker Commands
```bash
# Build images
docker build -t ecommerce-backend ./backend
docker build -t ecommerce-frontend ./frontend-app

# Run with specific environment
docker-compose -f docker-compose.staging.yml up -d
```

## 📋 Environment Variables

### Required Variables by Environment

#### Development
- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`
- `EMAIL_*` (optional for local development)

#### Staging/Production
- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`
- `API_URL`
- `GITHUB_TOKEN` (for container registry)

### GitHub Secrets Configuration

Add these secrets to your GitHub repository:

```
# Database
STAGING_POSTGRES_PASSWORD
PROD_POSTGRES_PASSWORD

# JWT
STAGING_JWT_SECRET_KEY
PROD_JWT_SECRET_KEY

# Email
STAGING_EMAIL_HOST
STAGING_EMAIL_USERNAME
STAGING_EMAIL_PASSWORD
PROD_EMAIL_HOST
PROD_EMAIL_USERNAME
PROD_EMAIL_PASSWORD

# URLs
STAGING_API_URL
PROD_API_URL
```

## 🔍 Troubleshooting

### Common Issues

1. **Tests Failing in CI**
   ```bash
   # Check test output
   docker-compose logs backend
   
   # Run tests locally
   dotnet test --logger console
   ```

2. **Docker Build Issues**
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker build --no-cache -t app ./backend
   ```

3. **Database Connection Issues**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec postgres psql -U postgres -d ecommerce_dev
   ```

### Performance Optimization

1. **Docker Layer Caching**
   - Copy package files first
   - Install dependencies before copying source code
   - Use multi-stage builds

2. **Test Optimization**
   - Use in-memory database for unit tests
   - Parallel test execution
   - Test categorization

3. **Build Optimization**
   - Use build cache in CI
   - Optimize Docker image size
   - Minimize build context

## 📚 Additional Resources

- [.NET Testing Best Practices](https://docs.microsoft.com/en-us/dotnet/core/testing/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🤝 Contributing

1. Follow TDD principles
2. Write comprehensive tests
3. Ensure all CI checks pass
4. Update documentation
5. Follow conventional commit messages

---

This TDD & CI/CD implementation provides a robust foundation for developing, testing, and deploying the e-commerce application with confidence and reliability.