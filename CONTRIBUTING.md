# Contributing to OpenPump

Thank you for your interest in contributing to OpenPump! This document provides guidelines and information about contributing.

## Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/openpump-api.git
   cd openpump-api
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Example: `feature/add-token-search`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance

Example:
```
feat(websocket): add token filtering support

Added ability to filter WebSocket stream by:
- Market cap range
- Bonding curve progress
- Creator address
```

### Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Use meaningful variable names
- Add JSDoc comments for public functions
- Keep functions small and focused

### Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "bonding curve"
```

Write tests for:
- New features
- Bug fixes
- Edge cases

## Pull Request Process

1. **Create a PR** against the `main` branch
2. **Fill out the PR template** completely
3. **Ensure CI passes** (tests, linting)
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** if requested

### PR Checklist

- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No secrets or sensitive data
- [ ] Commit messages follow convention
- [ ] PR description is complete

## Areas to Contribute

### Good First Issues

Look for issues labeled `good first issue`:
- Documentation improvements
- Code comments
- Minor bug fixes
- Test coverage

### Feature Ideas

- Additional Pump.fun metrics
- More filtering options
- Performance optimizations
- New API endpoints
- Frontend improvements

### Documentation

- API documentation
- Code examples
- Tutorial articles
- README improvements

## Architecture Overview

```
src/
├── config/         # Configuration management
├── middleware/     # Express middleware
├── models/         # Database models
├── routes/         # API route handlers
├── services/       # Business logic
├── types/          # TypeScript types
└── utils/          # Utility functions

web/                # Next.js frontend
├── app/            # App router pages
├── components/     # React components
└── hooks/          # Custom hooks
```

## API Development

When adding new endpoints:

1. Define types in `src/types/`
2. Add validation with Zod
3. Implement service in `src/services/`
4. Create route in `src/routes/`
5. Add Swagger documentation
6. Write tests
7. Update API docs

## Questions?

- Open a GitHub Discussion
- Join our Discord (coming soon)
- Email: contributors@openpump.io

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to OpenPump! 🚀
