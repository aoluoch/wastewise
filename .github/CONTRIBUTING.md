# Contributing to Wastewise

Thank you for your interest in contributing to Wastewise! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 18 or higher
- pnpm 10 (for client)
- npm (for server)
- Git

### Initial Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/wastewise.git
cd wastewise
```

2. **Install dependencies**

Client:
```bash
cd client
pnpm install
```

Server:
```bash
cd server
npm install
```

3. **Set up environment variables**
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

## Development Workflow

### Before Making Changes

1. **Create a new branch**
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes**
- Write clean, readable code
- Follow existing code style
- Add comments for complex logic

### Before Committing

**Run all checks locally** to ensure CI will pass:

#### Client Checks
```bash
cd client

# Type check
pnpm type-check

# Lint
pnpm lint

# Format check
pnpm format:check

# Build
pnpm build
```

If there are issues:
```bash
# Auto-fix linting errors
pnpm lint:fix

# Auto-format code
pnpm format
```

#### Server Checks
```bash
cd server

# Lint
npm run lint

# Format check
npm run format:check

# Run tests
npm test
```

If there are issues:
```bash
# Auto-fix linting errors
npm run lint:fix

# Auto-format code
npm run format
```

### Commit Guidelines

Use semantic commit messages:

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add or update tests
chore: Update dependencies
```

Examples:
```bash
git commit -m "feat: Add collector route optimization"
git commit -m "fix: Resolve TypeScript error in TaskAssignment"
git commit -m "docs: Update API documentation"
```

### Push and Create PR

1. **Push your branch**
```bash
git push origin feature/your-feature-name
```

2. **Create Pull Request**
- Go to GitHub and create a PR
- Fill in the PR template
- Link any related issues
- Wait for CI checks to pass
- Request review from maintainers

## Code Style Guidelines

### TypeScript/JavaScript

1. **Use TypeScript types** - Avoid `any`, use `unknown` or proper types
```typescript
// ❌ Bad
catch (error: any) {
  console.log(error.message)
}

// ✅ Good
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message)
  }
}
```

2. **Use const over let** - Prefer immutability
```typescript
// ❌ Bad
let name = 'John'

// ✅ Good
const name = 'John'
```

3. **Use arrow functions** for callbacks
```typescript
// ❌ Bad
array.map(function(item) {
  return item * 2
})

// ✅ Good
array.map(item => item * 2)
```

4. **Destructure when possible**
```typescript
// ❌ Bad
const name = user.name
const email = user.email

// ✅ Good
const { name, email } = user
```

### React Components

1. **Use functional components** with hooks
2. **Keep components small** and focused
3. **Extract reusable logic** into custom hooks
4. **Use proper prop types**

```typescript
// ✅ Good component structure
interface Props {
  title: string
  onClose: () => void
}

export const Modal: React.FC<Props> = ({ title, onClose }) => {
  // Component logic
  return (
    // JSX
  )
}
```

### Node.js/Express

1. **Use async/await** over callbacks
2. **Handle errors properly**
3. **Validate input** using express-validator
4. **Use middleware** for common functionality

```javascript
// ✅ Good route handler
router.post('/api/resource', 
  authenticate,
  validate,
  async (req, res) => {
    try {
      const result = await service.create(req.body)
      res.json({ success: true, data: result })
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error.message 
      })
    }
  }
)
```

## Testing

### Client Tests
```bash
cd client
pnpm test          # Run tests
pnpm test:ui       # Run tests with UI
pnpm test:coverage # Run with coverage
```

### Server Tests
```bash
cd server
npm test           # Run tests
npm run test:watch # Watch mode
```

### Writing Tests

1. **Test user behavior**, not implementation
2. **Use descriptive test names**
3. **Follow AAA pattern**: Arrange, Act, Assert

```javascript
describe('User Authentication', () => {
  it('should return token when credentials are valid', async () => {
    // Arrange
    const credentials = { email: 'test@example.com', password: 'password' }
    
    // Act
    const response = await request(app)
      .post('/api/auth/login')
      .send(credentials)
    
    // Assert
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })
})
```

## CI/CD Pipeline

Our CI/CD pipeline runs automatically on every push and PR. It includes:

1. ✅ **Linting** - ESLint for code quality
2. ✅ **Type Checking** - TypeScript validation
3. ✅ **Format Checking** - Prettier formatting
4. ✅ **Testing** - Jest unit tests
5. ✅ **Security Audit** - npm/pnpm audit
6. ✅ **Building** - Production builds
7. ✅ **Docker** - Container images (main branch)

### Pipeline Status

All checks must pass before merging. If any check fails:

1. Review the error in GitHub Actions
2. Fix the issue locally
3. Run checks locally to verify
4. Push the fix

### Common CI Failures

**Linting errors**:
```bash
pnpm lint:fix  # Client
npm run lint:fix  # Server
```

**Format errors**:
```bash
pnpm format  # Client
npm run format  # Server
```

**Type errors**:
- Fix TypeScript errors in your code
- Check the CI logs for specific errors

**Test failures**:
- Run tests locally: `npm test`
- Fix failing tests
- Ensure tests pass before pushing

## Pull Request Process

1. **Ensure all CI checks pass** ✅
2. **Update documentation** if needed
3. **Add tests** for new features
4. **Request review** from maintainers
5. **Address review comments**
6. **Squash commits** if requested
7. **Wait for approval** before merging

## Getting Help

- 📖 Check the [documentation](../docs/)
- 💬 Ask questions in GitHub Discussions
- 🐛 Report bugs via GitHub Issues
- 📧 Contact maintainers

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow project guidelines

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to Wastewise! 🎉
