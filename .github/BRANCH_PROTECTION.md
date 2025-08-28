# GitHub Branch Protection Setup

This document explains how to set up branch protection rules for the main branch to ensure all tests pass before merging.

## Prerequisites

1. Repository admin access
2. The CI/CD pipeline is set up (`.github/workflows/ci.yml`)
3. Tests are working locally (`npm run test:run`)

## Setting Up Branch Protection Rules

### Via GitHub Web Interface

1. Navigate to your repository on GitHub
2. Go to **Settings** → **Branches**
3. Click **Add rule** next to "Branch protection rules"
4. Configure the following settings:

#### Branch name pattern
```
main
```

#### Protection Rules (Check these boxes)

**Protect matching branches:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1` (minimum)
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (optional)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:** (Add these after first CI run)
    - `Test & Lint`
    - `Build` 
    - `Security Audit`
    - `Quality Gate`

- ✅ **Require conversation resolution before merging**

- ✅ **Require signed commits** (recommended for security)

- ✅ **Require linear history** (optional, prevents merge commits)

- ✅ **Include administrators** (applies rules to admins too)

### Via GitHub CLI (Alternative)

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Set up branch protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Test & Lint","Build","Security Audit","Quality Gate"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## CI/CD Pipeline Status Checks

The pipeline includes these jobs that must pass:

1. **Test & Lint** - Runs ESLint and Vitest tests
2. **Build** - Ensures the application builds successfully
3. **Security Audit** - Checks for security vulnerabilities
4. **Quality Gate** - Overall quality validation
5. **PR Validation** - Special checks for PRs to main

## Required Status Checks to Add

After your first CI run, add these status check names in the branch protection settings:

```
Test & Lint
Build  
Security Audit
Quality Gate
```

## Development Workflow

With branch protection enabled:

1. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   # Create PR via GitHub web interface
   ```

4. **CI pipeline runs automatically:**
   - Tests must pass ✅
   - Build must succeed ✅  
   - Linting must pass ✅
   - Security checks must pass ✅

5. **Merge only after:**
   - All status checks pass ✅
   - Required approvals received ✅
   - Conversations resolved ✅

## Testing Locally Before Push

Always run these commands before pushing:

```bash
# Run all tests
npm run test:run

# Run linting
npm run lint

# Check TypeScript
npm run type-check

# Test build
npm run build

# Run coverage (optional)
npm run test:coverage
```

## Troubleshooting

### Status Checks Not Appearing
- Wait for the first CI run to complete
- Check that workflow file is in `.github/workflows/`
- Ensure job names match exactly

### Tests Failing in CI but Passing Locally
- Check Node.js version matches (20.x)
- Ensure `pnpm-lock.yaml` is committed
- Review any environment differences

### Security Audit Failures
- Run `pnpm audit` locally
- Update vulnerable dependencies
- Check GitHub Security tab for alerts

## Security Considerations

1. **Required approvals** prevent single-person merges
2. **Signed commits** ensure commit authenticity  
3. **Status checks** prevent broken code in main
4. **Security audits** catch vulnerable dependencies
5. **Administrator enforcement** applies rules to all users

## Coverage Thresholds

Current coverage requirements (configured in `vite.config.ts`):
- **Branches:** 80%
- **Functions:** 80% 
- **Lines:** 80%
- **Statements:** 80%

Coverage reports are generated on each CI run and can be viewed in the Actions logs.
