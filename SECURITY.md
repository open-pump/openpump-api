# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### Do NOT

- Open a public GitHub issue
- Discuss the vulnerability publicly
- Exploit the vulnerability beyond what's necessary to verify it exists

### Do

1. **Email us directly** at security@openpump.io
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes (optional)

3. **Allow up to 48 hours** for initial response
4. **Work with us** to understand and resolve the issue

## What to Expect

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Timeline**: Varies by severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

## Recognition

We believe in recognizing security researchers:

- Credit in release notes (with permission)
- Hall of Fame on our website
- Bounty consideration for critical issues

## Scope

### In Scope

- API endpoint vulnerabilities
- Authentication/authorization flaws
- SQL injection, XSS, CSRF
- Data exposure/leakage
- Rate limiting bypasses
- WebSocket security issues

### Out of Scope

- Social engineering attacks
- Physical security issues
- DDoS attacks
- Issues in dependencies (report upstream)
- Issues requiring unlikely user interaction

## Security Best Practices

When contributing to OpenPump:

1. Never commit secrets, API keys, or credentials
2. Use environment variables for sensitive configuration
3. Validate all user input
4. Use parameterized queries for database operations
5. Follow the principle of least privilege
6. Keep dependencies updated

Thank you for helping keep OpenPump secure!
