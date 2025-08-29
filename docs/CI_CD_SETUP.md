# CI/CD Pipeline & Branch Protection

This repository is protected by automated testing and quality checks.

## 🚦 Status Checks

All pull requests to `main` must pass:

- ✅ **Tests** - All 135 unit tests must pass
- ✅ **Linting** - Code must follow ESLint rules  
- ✅ **Type Checking** - TypeScript compilation must succeed
- ✅ **Build** - Application must build successfully
- ✅ **Security** - No critical vulnerabilities allowed

## 🧪 Running Tests Locally

```bash
# Run all tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Type check
npm run type-check

# Build check
npm run build
```

## 📋 Setup Instructions

### For Repository Admins

1. Go to **Settings → Branches** in GitHub
2. Add protection rule for `main` branch
3. Enable required status checks:
   - `Test & Lint`
   - `Build`
   - `Security Audit` 
   - `Quality Gate`
4. Require pull request reviews

### For Developers

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push and create pull request
4. Wait for all checks to pass ✅
5. Get required approvals
6. Merge to main

## 📊 Coverage Requirements

- **Lines:** 80% minimum
- **Functions:** 80% minimum  
- **Branches:** 80% minimum
- **Statements:** 80% minimum

Current coverage: **84.49%** (comprehensive test coverage)

## 🔧 Workflow Files

- `.github/workflows/ci.yml` - Main CI/CD pipeline
- `.github/BRANCH_PROTECTION.md` - Detailed setup guide

The pipeline runs on every push and pull request, ensuring code quality and preventing regressions.
