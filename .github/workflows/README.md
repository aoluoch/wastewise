# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Wastewise project.

## Overview

The pipeline is implemented using GitHub Actions and runs on every push and pull request to the `main` and `develop` branches.

## Pipeline Jobs

### 1. Client Tests (`client-tests`)
**Purpose**: Lint, type-check, and format-check the client code

**Steps**:
- Checkout code
- Setup Node.js 18 and pnpm 10
- Install dependencies with `pnpm install --frozen-lockfile`
- Run TypeScript type checking: `pnpm type-check`
- Run ESLint: `pnpm lint`
- Check code formatting: `pnpm format:check`

**Triggers**: All pushes and PRs

### 2. Client Build (`client-build`)
**Purpose**: Build the client application for production

**Steps**:
- Checkout code
- Setup Node.js and pnpm
- Install dependencies
- Build production bundle: `pnpm build`
- Upload build artifacts (retained for 7 days)

**Triggers**: After `client-tests` passes
**Dependencies**: `client-tests`

### 3. Server Tests (`server-tests`)
**Purpose**: Lint, format-check, and test the server code

**Steps**:
- Checkout code
- Setup Node.js 18 with npm cache
- Install dependencies with `npm ci`
- Run ESLint: `npm run lint`
- Check code formatting: `npm run format:check`
- Run Jest tests: `npm test`

**Triggers**: All pushes and PRs

### 4. Client Security (`client-security`)
**Purpose**: Run security audit on client dependencies

**Steps**:
- Checkout code
- Setup Node.js and pnpm
- Install dependencies
- Run security audit: `pnpm audit --audit-level moderate`

**Triggers**: All pushes and PRs
**Note**: Continues on error to not block the pipeline

### 5. Server Security (`server-security`)
**Purpose**: Run security audit on server dependencies

**Steps**:
- Checkout code
- Setup Node.js
- Install dependencies
- Run security audit: `npm audit --audit-level moderate`

**Triggers**: All pushes and PRs
**Note**: Continues on error to not block the pipeline

### 6. Docker Build (`docker-build`)
**Purpose**: Build and push Docker images for both client and server

**Steps**:
- Checkout code
- Setup Docker Buildx
- Login to Docker Hub (using secrets)
- Build and push client image with tags:
  - `wastewise-client:latest`
  - `wastewise-client:<commit-sha>`
- Build and push server image with tags:
  - `wastewise-server:latest`
  - `wastewise-server:<commit-sha>`

**Triggers**: Only on pushes to `main` branch
**Dependencies**: `client-build`, `server-tests`, `client-security`, `server-security`

### 7. Notify (`notify`)
**Purpose**: Provide summary of pipeline execution

**Steps**:
- Check all job results
- Display success or failure summary with details

**Triggers**: Always runs after all jobs complete
**Dependencies**: All test and build jobs

## Required Secrets

To enable Docker image pushing, add these secrets to your GitHub repository:

1. `DOCKER_USERNAME` - Your Docker Hub username
2. `DOCKER_PASSWORD` - Your Docker Hub password or access token

**How to add secrets**:
1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its value

## Environment Variables

- `NODE_VERSION`: 18 (Node.js version)
- `PNPM_VERSION`: 10 (pnpm version for client)
- `HUSKY`: 0 (Disable Husky in CI)

## Caching Strategy

### Client (pnpm)
- Caches pnpm store directory
- Cache key: `${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}`
- Significantly speeds up dependency installation

### Server (npm)
- Uses built-in npm cache from `actions/setup-node@v4`
- Cache key based on `server/package-lock.json`

## Branch Strategy

### Main Branch
- Runs all tests, builds, security audits
- Builds and pushes Docker images
- Should be protected with required status checks

### Develop Branch
- Runs all tests, builds, security audits
- Does NOT build Docker images

### Pull Requests
- Runs all tests and security audits
- Does NOT build Docker images
- Does NOT push to Docker Hub

## Local Testing

Before pushing, you can run the same checks locally:

### Client
```bash
cd client
pnpm install
pnpm type-check
pnpm lint
pnpm format:check
pnpm build
```

### Server
```bash
cd server
npm install
npm run lint
npm run format:check
npm test
```

## Troubleshooting

### Pipeline Fails on Lint
- Run `pnpm lint:fix` (client) or `npm run lint:fix` (server) locally
- Commit the fixes

### Pipeline Fails on Format Check
- Run `pnpm format` (client) or `npm run format` (server) locally
- Commit the formatted files

### Pipeline Fails on Type Check
- Fix TypeScript errors in your code
- Avoid using `any` types (use `unknown` instead)

### Pipeline Fails on Tests
- Run tests locally: `npm test`
- Fix failing tests before pushing

### Docker Build Fails
- Ensure Dockerfiles are present in both `client/` and `server/`
- Check that Docker secrets are configured correctly

## Performance Optimization

1. **Parallel Execution**: Jobs run in parallel where possible
2. **Dependency Caching**: Both pnpm and npm caches are utilized
3. **Artifact Retention**: Build artifacts kept for 7 days only
4. **Docker Layer Caching**: Uses registry cache for faster builds

## Best Practices

1. **Always run tests locally** before pushing
2. **Keep dependencies updated** to avoid security vulnerabilities
3. **Review security audit results** regularly
4. **Use semantic commit messages** for better tracking
5. **Protect main branch** with required status checks
6. **Review PR checks** before merging

## Status Badges

Add these badges to your README.md:

```markdown
![CI/CD Pipeline](https://github.com/YOUR_USERNAME/wastewise/workflows/CI/CD%20Pipeline/badge.svg)
```

Replace `YOUR_USERNAME` with your GitHub username.
