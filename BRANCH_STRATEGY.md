# Git Branch Strategy for E-commerce Application

## Branch Structure

### 🌟 Main Branch (`main`)
- **Purpose**: Production-ready code
- **Deployment**: Automatically deploys to production environment
- **Protection**: Protected branch, requires PR approval
- **Merges from**: `staging` branch only

### 🚀 Staging Branch (`staging`)
- **Purpose**: Pre-production testing and validation
- **Deployment**: Automatically deploys to staging environment
- **Testing**: Full integration testing, user acceptance testing
- **Merges from**: `development` branch
- **Merges to**: `main` branch

### 🔧 Development Branch (`development`)
- **Purpose**: Integration of new features and bug fixes
- **Deployment**: Automatically deploys to development environment
- **Testing**: Automated tests, basic integration testing
- **Merges from**: Feature branches, hotfix branches
- **Merges to**: `staging` branch

## Workflow Process

### 1. Feature Development
```bash
# Create feature branch from development
git checkout development
git pull origin development
git checkout -b feature/your-feature-name

# Work on your feature
# ... make changes ...

# Push feature branch
git push origin feature/your-feature-name

# Create PR to development branch
```

### 2. Development to Staging
```bash
# When development is stable
git checkout staging
git pull origin staging
git merge development
git push origin staging
```

### 3. Staging to Production
```bash
# After staging validation
git checkout main
git pull origin main
git merge staging
git push origin main
```

## CI/CD Pipeline Triggers

### Development Branch
- **Triggers**: Push to `development`
- **Actions**: 
  - Run all tests (frontend + backend)
  - Build Docker images
  - Deploy to development environment
  - Run smoke tests

### Staging Branch
- **Triggers**: Push to `staging`
- **Actions**:
  - Run full test suite
  - Build and tag Docker images
  - Deploy to staging environment
  - Run integration tests
  - Performance testing

### Main Branch
- **Triggers**: Push to `main`
- **Actions**:
  - Run production tests
  - Build production Docker images
  - Deploy to production environment
  - Run health checks
  - Send deployment notifications

## Environment Configuration

### Development Environment
- **URL**: `dev.yourdomain.com`
- **Database**: Development database
- **Features**: Debug mode enabled, detailed logging
- **Testing**: Automated tests on every commit

### Staging Environment
- **URL**: `staging.yourdomain.com`
- **Database**: Staging database (production-like data)
- **Features**: Production-like configuration
- **Testing**: Full integration and user acceptance testing

### Production Environment
- **URL**: `yourdomain.com`
- **Database**: Production database
- **Features**: Optimized for performance and security
- **Monitoring**: Full monitoring and alerting

## Branch Protection Rules

### Main Branch
- Require pull request reviews (minimum 1)
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to administrators only

### Staging Branch
- Require pull request reviews
- Require status checks to pass
- Allow force pushes for hotfixes

### Development Branch
- Require status checks to pass
- Allow direct pushes for quick fixes

## Hotfix Process

For critical production issues:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Fix the issue
# ... make changes ...

# Push and create PR to main
git push origin hotfix/critical-issue

# After merge to main, also merge to development
git checkout development
git merge main
git push origin development
```

## Release Process

### 1. Prepare Release
- Ensure all features are merged to development
- Update version numbers
- Update CHANGELOG.md

### 2. Deploy to Staging
- Merge development to staging
- Run full test suite
- Perform user acceptance testing

### 3. Deploy to Production
- Merge staging to main
- Monitor deployment
- Verify production health

### 4. Post-Release
- Tag the release
- Update documentation
- Communicate release notes

## Commands Quick Reference

```bash
# Switch branches
git checkout development
git checkout staging
git checkout main

# Create feature branch
git checkout -b feature/new-feature

# Update branch with latest changes
git pull origin branch-name

# Merge branches
git merge source-branch

# Push changes
git push origin branch-name

# View all branches
git branch -a

# Delete feature branch (after merge)
git branch -d feature/branch-name
git push origin --delete feature/branch-name
```

## Best Practices

1. **Always create feature branches** from development
2. **Keep commits small and focused**
3. **Write descriptive commit messages**
4. **Test locally before pushing**
5. **Use pull requests for code review**
6. **Keep branches up to date** with their parent branch
7. **Delete merged feature branches** to keep repository clean
8. **Use semantic versioning** for releases
9. **Document breaking changes** in commit messages
10. **Monitor CI/CD pipeline** for failures

## Troubleshooting

### Merge Conflicts
```bash
# Pull latest changes
git pull origin target-branch

# Resolve conflicts in your editor
# Add resolved files
git add .

# Complete the merge
git commit -m "resolve: merge conflicts"
```

### Failed CI/CD Pipeline
1. Check the GitHub Actions tab for error details
2. Fix the issue locally
3. Push the fix
4. Monitor the pipeline again

### Rollback Production
```bash
# Find the last good commit
git log --oneline

# Create rollback branch
git checkout -b rollback/to-commit-hash commit-hash

# Push and deploy
git push origin rollback/to-commit-hash
```