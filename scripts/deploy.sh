#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified. Usage: ./deploy.sh [development|staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment. Must be one of: development, staging, production"
    exit 1
fi

print_status "Starting deployment for $ENVIRONMENT environment..."

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    print_status "Loading environment variables from .env.$ENVIRONMENT"
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    print_warning "No .env.$ENVIRONMENT file found"
fi

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    print_status "Running backend tests..."
    cd backend
    dotnet test --configuration Release --logger trx --results-directory TestResults
    cd ..
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd frontend-app
    npm test -- --run --coverage
    cd ..
    
    print_status "All tests passed!"
}

# Function to build and push Docker images
build_and_push() {
    print_status "Building and pushing Docker images..."
    
    # Get git commit hash for tagging
    GIT_COMMIT=$(git rev-parse --short HEAD)
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    
    # Build backend
    print_status "Building backend image..."
    docker build -t "ecommerce-backend:$ENVIRONMENT-$GIT_COMMIT" ./backend
    docker tag "ecommerce-backend:$ENVIRONMENT-$GIT_COMMIT" "ecommerce-backend:$ENVIRONMENT-latest"
    
    # Build frontend
    print_status "Building frontend image..."
    docker build -t "ecommerce-frontend:$ENVIRONMENT-$GIT_COMMIT" ./frontend-app
    docker tag "ecommerce-frontend:$ENVIRONMENT-$GIT_COMMIT" "ecommerce-frontend:$ENVIRONMENT-latest"
    
    print_status "Docker images built successfully!"
}

# Function to deploy to environment
deploy() {
    print_status "Deploying to $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        "development")
            docker-compose -f docker-compose.yml up -d --build
            ;;
        "staging")
            docker-compose -f docker-compose.staging.yml up -d
            ;;
        "production")
            # Production deployment with zero-downtime
            print_status "Performing zero-downtime deployment..."
            docker-compose -f docker-compose.production.yml up -d --no-deps backend frontend
            
            # Wait for health checks
            print_status "Waiting for services to be healthy..."
            sleep 30
            
            # Verify deployment
            if ! curl -f http://localhost:5222/health > /dev/null 2>&1; then
                print_error "Backend health check failed!"
                exit 1
            fi
            
            if ! curl -f http://localhost:3000/health > /dev/null 2>&1; then
                print_error "Frontend health check failed!"
                exit 1
            fi
            ;;
    esac
    
    print_status "Deployment completed successfully!"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    docker-compose exec backend dotnet ef database update
    
    print_status "Database migrations completed!"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check backend health
    if curl -f http://localhost:5222/health > /dev/null 2>&1; then
        print_status "Backend is healthy ✓"
    else
        print_error "Backend health check failed ✗"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "Frontend is healthy ✓"
    else
        print_error "Frontend health check failed ✗"
        return 1
    fi
    
    print_status "Deployment verification completed successfully!"
}

# Main deployment flow
main() {
    print_status "=== E-Commerce Application Deployment ==="
    print_status "Environment: $ENVIRONMENT"
    print_status "Git Commit: $(git rev-parse --short HEAD)"
    print_status "Timestamp: $(date)"
    
    # Skip tests for development environment (optional)
    if [ "$ENVIRONMENT" != "development" ]; then
        run_tests
    fi
    
    build_and_push
    deploy
    
    # Run migrations for staging and production
    if [ "$ENVIRONMENT" != "development" ]; then
        run_migrations
    fi
    
    verify_deployment
    
    print_status "=== Deployment Complete ==="
    print_status "Backend URL: http://localhost:5222"
    print_status "Frontend URL: http://localhost:3000"
    print_status "Environment: $ENVIRONMENT"
}

# Run main function
main