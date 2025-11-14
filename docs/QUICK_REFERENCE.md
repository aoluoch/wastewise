# Quick Reference - CI/CD Commands

## 🚀 Quick Start

### Client (pnpm)
```bash
cd client
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm type-check       # TypeScript check ✓
pnpm lint             # Lint check ✓
pnpm format:check     # Format check ✓
pnpm build            # Production build ✓
```

### Server (npm)
```bash
cd server
npm install           # Install dependencies
npm run dev           # Start dev server
npm run lint          # Lint check ✓
npm run format:check  # Format check ✓
npm test              # Run tests ✓
```

## 🔧 Fix Commands

### Auto-fix Issues

**Client**:
```bash
cd client
pnpm lint:fix         # Fix linting errors
pnpm format           # Format code
```

**Server**:
```bash
cd server
npm run lint:fix      # Fix linting errors
npm run format        # Format code
```

## ✅ Pre-Commit Checklist

Run these before committing:

```bash
# Client
cd client && pnpm type-check && pnpm lint && pnpm format:check && pnpm build

# Server
cd server && npm run lint && npm run format:check && npm test
```

Or use this one-liner from project root:
```bash
(cd client && pnpm type-check && pnpm lint && pnpm format:check) && \
(cd server && npm run lint && npm run format:check && npm test)
```

## 🐳 Docker Commands

### Build Images
```bash
# Client
docker build -t wastewise-client ./client

# Server
docker build -t wastewise-server ./server

# Both with docker-compose
docker-compose build
```

### Run Containers
```bash
# Client (port 3000)
docker run -p 3000:80 wastewise-client

# Server (port 5000)
docker run -p 5000:5000 --env-file ./server/.env wastewise-server

# Both with docker-compose
docker-compose up
```

## 📊 CI/CD Pipeline Jobs

| Job | What it does | When it runs |
|-----|-------------|--------------|
| `client-tests` | Type check, lint, format check | Every push/PR |
| `client-build` | Build production bundle | After client-tests |
| `server-tests` | Lint, format check, tests | Every push/PR |
| `client-security` | Security audit | Every push/PR |
| `server-security` | Security audit | Every push/PR |
| `docker-build` | Build & push Docker images | Main branch only |
| `notify` | Status summary | Always |

## 🔍 Troubleshooting

### Linting Errors
```bash
# See errors
pnpm lint  # or npm run lint

# Fix automatically
pnpm lint:fix  # or npm run lint:fix
```

### Format Errors
```bash
# See errors
pnpm format:check  # or npm run format:check

# Fix automatically
pnpm format  # or npm run format
```

### Type Errors
```bash
# Check types
pnpm type-check

# Common fixes:
# - Replace 'any' with 'unknown'
# - Add proper type annotations
# - Use 'error instanceof Error' checks
```

### Test Failures
```bash
# Run tests
npm test

# Watch mode (auto-rerun)
npm run test:watch

# With coverage
pnpm test:coverage
```

## 📝 Commit Message Format

```
<type>: <description>

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation
- style:    Formatting
- refactor: Code restructuring
- test:     Tests
- chore:    Dependencies, config
```

Examples:
```bash
git commit -m "feat: Add route optimization for collectors"
git commit -m "fix: Resolve TypeScript error in TaskAssignment"
git commit -m "docs: Update API documentation"
git commit -m "test: Add unit tests for auth service"
```

## 🌿 Git Workflow

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Make changes and test locally
pnpm type-check && pnpm lint && pnpm build  # Client
npm run lint && npm test                     # Server

# 3. Commit
git add .
git commit -m "feat: Add my feature"

# 4. Push
git push origin feature/my-feature

# 5. Create PR on GitHub
# 6. Wait for CI to pass ✅
# 7. Get review and merge
```

## 🔐 GitHub Secrets (for Docker)

Add these in: **Settings → Secrets and variables → Actions**

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password/token |

## 📦 Package Management

### Client (pnpm)
```bash
pnpm add <package>           # Add dependency
pnpm add -D <package>        # Add dev dependency
pnpm remove <package>        # Remove package
pnpm update                  # Update all packages
pnpm audit                   # Security audit
```

### Server (npm)
```bash
npm install <package>        # Add dependency
npm install -D <package>     # Add dev dependency
npm uninstall <package>      # Remove package
npm update                   # Update all packages
npm audit                    # Security audit
npm audit fix                # Fix vulnerabilities
```

## 🎯 Performance Tips

1. **Use cache**: CI uses pnpm/npm cache for faster installs
2. **Run in parallel**: Independent checks run simultaneously
3. **Local testing**: Catch errors before pushing
4. **Small commits**: Easier to review and debug
5. **Descriptive messages**: Help track changes

## 📚 Documentation

- [CI/CD Setup](./CI_CD_SETUP.md) - Complete setup guide
- [Pipeline Docs](./.github/workflows/README.md) - Detailed pipeline info
- [Contributing](./.github/CONTRIBUTING.md) - Contribution guidelines
- [API Docs](./docs/API_DOCUMENTATION.md) - API reference

## 🆘 Need Help?

1. Check CI logs in GitHub Actions tab
2. Run commands locally to reproduce
3. Review error messages carefully
4. Check documentation
5. Ask in GitHub Discussions

---

**Pro Tip**: Add these aliases to your shell config:

```bash
# ~/.bashrc or ~/.zshrc
alias ww-client="cd ~/path/to/wastewise/client"
alias ww-server="cd ~/path/to/wastewise/server"
alias ww-check-client="cd ~/path/to/wastewise/client && pnpm type-check && pnpm lint && pnpm format:check"
alias ww-check-server="cd ~/path/to/wastewise/server && npm run lint && npm run format:check && npm test"
alias ww-fix-client="cd ~/path/to/wastewise/client && pnpm lint:fix && pnpm format"
alias ww-fix-server="cd ~/path/to/wastewise/server && npm run lint:fix && npm run format"
```

Then just run: `ww-check-client` or `ww-fix-server` 🚀
