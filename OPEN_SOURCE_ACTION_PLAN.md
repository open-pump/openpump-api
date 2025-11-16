# OpenPump API - Open Source Release Action Plan

## URGENT: CRITICAL SECURITY ISSUE

### Immediate Action Required (Next 30 minutes)

**REVOKE EXPOSED HELIUS API KEY**

The following API key is exposed in the `.env` file and must be revoked immediately:
```
Key: 6ac540c1-3038-4a53-99d7-b48a381c9dec
Location: .env (lines 16-17)
```

**Steps to revoke:**
1. Go to https://dashboard.helius-rpc.com
2. Log in to your account
3. Find the API key: `6ac540c1-3038-4a53-99d7-b48a381c9dec`
4. Click "Revoke" or "Delete"
5. Confirm revocation
6. Generate a new API key for local development
7. Update `.env` with the new key (note: `.env` will NOT be committed to git)

**Why this is critical:**
- Anyone who clones the repo can use this key to make API calls
- The key has rate limits tied to your account
- Costs could be incurred if someone abuses the key
- Once committed to public git history, it's exposed forever

---

## HIGH PRIORITY: Package Metadata (1-2 hours)

### Update package.json

Replace the author and add missing fields:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/openpump-api.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/openpump-api/issues"
  },
  "homepage": "https://github.com/yourusername/openpump-api#readme"
}
```

### Update README.md

1. Replace all instances of `yourusername` with your actual GitHub username
2. Update Discord link or remove if not ready:
   - Current: `[Discord](https://discord.gg/openpump) for real-time chat`
   - Either: Add real Discord link
   - Or: Remove Discord reference

3. Add author/maintainer section (after Features):
   ```markdown
   ## Maintainers
   - [Your Name](https://github.com/yourusername) - Creator and Lead Developer
   ```

4. Optional: Add Acknowledgments section at end

---

## MEDIUM PRIORITY: Documentation Files (2-3 hours)

### Add SECURITY.md

Create a file that explains:
- How to report security vulnerabilities responsibly
- Do NOT create public issues for security bugs
- Email contact for security reports
- Response timeline expectations

Example template:
```markdown
# Security Policy

## Reporting a Vulnerability

Please email security@example.com instead of using the issue tracker.

We will acknowledge receipt within 24 hours and keep you updated on our progress.

## Supported Versions

- v1.x.x - Current version

## Security Best Practices for Deployment

1. Never commit .env files
2. Rotate API keys regularly
3. Use HTTPS in production
4. Keep dependencies updated
5. Monitor for unauthorized access
```

### Add CODE_OF_CONDUCT.md

```markdown
# Contributor Code of Conduct

## Our Pledge

We are committed to providing a welcoming and inspiring community.

## Our Standards

Be respectful, inclusive, and professional.

## Enforcement

Report violations to [maintainer email]
```

### Create CHANGELOG.md

Document the release history:
```markdown
# Changelog

## [0.1.0] - 2025-11-16

### Added
- Initial public release
- Real-time token monitoring
- Bonding curve analysis
- Multi-source pricing
- WebSocket real-time stream
- Rate limiting per API tier
- Redis caching
- PostgreSQL persistence
- OpenAPI/Swagger documentation

### Status
- Core API functional
- 4/6 endpoints fully tested
- Production-ready foundation
```

---

## OPTIONAL: Code Quality Improvements (1-2 hours each)

### Add .eslintrc.json

```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Add .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Add npm scripts to package.json

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\""
  }
}
```

### Add GitHub Actions Workflow (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

---

## RELEASE TIMELINE

### Week 1: Critical & High Priority
- [ ] Revoke API key (30 min) - DO THIS FIRST
- [ ] Update package.json metadata (30 min)
- [ ] Update README with real URLs (30 min)
- [ ] Create SECURITY.md (30 min)
- [ ] Create CODE_OF_CONDUCT.md (20 min)
- [ ] Create CHANGELOG.md (20 min)

**Estimated: 2.5 hours of work**

### Week 2: Optional Enhancements
- [ ] Add .eslintrc and .prettierrc (30 min)
- [ ] Add GitHub Actions CI/CD (1 hour)
- [ ] Test on fresh machine (1 hour)
- [ ] Add troubleshooting guide to README (30 min)

**Estimated: 3 hours of work**

### Week 3: Go Live
- [ ] Final review of all documentation
- [ ] Test deployment with fresh database
- [ ] Make first GitHub release
- [ ] Announce on social media

---

## VERIFICATION CHECKLIST

Before pushing to GitHub:

- [ ] Helius API key has been revoked
- [ ] `.env` file is in `.gitignore` (already is - verify)
- [ ] No other `.env` files exposed (check web/.env.local)
- [ ] package.json has author and repository fields
- [ ] All placeholder URLs replaced with real ones
- [ ] SECURITY.md exists and has contact info
- [ ] LICENSE file is correct (it is - just verify)
- [ ] README is up to date
- [ ] CONTRIBUTING.md references are correct
- [ ] No accidentally committed secrets (git history clean)

---

## POST-RELEASE MAINTENANCE

### Daily
- Monitor GitHub issues
- Check for error reports
- Watch dependency security alerts

### Weekly
- Review and respond to PRs
- Update dependencies if needed
- Monitor for reported issues

### Monthly
- Release updates if needed
- Update CHANGELOG.md
- Review metrics and usage

---

## SUCCESS CRITERIA

Your project is ready for open source when:

1. ✅ No secrets in code or git history
2. ✅ Complete documentation
3. ✅ Clear installation instructions
4. ✅ Working examples
5. ✅ Contributing guidelines
6. ✅ License properly attributed
7. ✅ No GPL/AGPL dependencies
8. ✅ Professional README
9. ✅ Security policy in place
10. ✅ Active maintenance plan

---

## QUESTIONS?

Refer to the full audit report: OPEN_SOURCE_AUDIT.md

Key sections:
- Section 1: Secrets & Sensitive Data (CRITICAL)
- Section 5: Package.json Audit
- Section 7: Licensing & Dependencies
