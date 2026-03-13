#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_status "Creating branch structure for TDD CI/CD..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_warning "Not in a git repository. Initializing..."
    git init
    git add .
    git commit -m "Initial commit with TDD CI/CD setup"
fi

# Create development branch
print_status "Creating development branch..."
git checkout -b development 2>/dev/null || git checkout development

# Create staging branch
print_status "Creating staging branch..."
git checkout -b staging 2>/dev/null || git checkout staging

# Go back to main/master
if git show-ref --verify --quiet refs/heads/main; then
    git checkout main
    print_status "Switched to main branch"
elif git show-ref --verify --quiet refs/heads/master; then
    git checkout master
    print_status "Switched to master branch"
else
    git checkout -b main
    print_status "Created and switched to main branch"
fi

print_status "Branch structure created successfully!"
print_status "Available branches:"
git branch -a

print_status ""
print_status "Recommended workflow:"
print_status "1. Work on feature branches from development"
print_status "2. Merge features to development for testing"
print_status "3. Promote development to staging for integration testing"
print_status "4. Promote staging to main for production deployment"
print_status ""
print_status "Example commands:"
print_status "  git checkout development"
print_status "  git checkout -b feature/new-feature"
print_status "  # ... make changes ..."
print_status "  git push origin feature/new-feature"
print_status "  # Create PR to development branch"