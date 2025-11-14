# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Wastewise, please report it by emailing security@wastewise.com. Please do not create public GitHub issues for security vulnerabilities.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Best Practices

### Environment Variables

**Never commit sensitive data to version control:**

❌ **DON'T:**
```env
# Bad - actual credentials
MONGODB_URI=mongodb+srv://admin:MyP@ssw0rd@cluster.mongodb.net/wastewise
JWT_SECRET=my-actual-secret-key-12345
CLOUDINARY_API_SECRET=actual-api-secret
```

✅ **DO:**
```env
# Good - use placeholders in documentation
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/wastewise
JWT_SECRET=your-super-secret-jwt-key-change-this
CLOUDINARY_API_SECRET=your-api-secret-here
```

### Secrets Management

1. **Use `.env` files** for local development (already in `.gitignore`)
2. **Use environment variables** in production
3. **Rotate secrets regularly** (at least every 90 days)
4. **Use different secrets** for development, staging, and production
5. **Never hardcode secrets** in source code

### Database Security

**MongoDB:**
- Use strong passwords (min 16 characters, mixed case, numbers, symbols)
- Enable IP whitelisting in MongoDB Atlas
- Use database-level authentication
- Regularly backup your database
- Monitor for suspicious activity

**Connection Strings:**
```bash
# Local development (safe for documentation)
mongodb://localhost:27017/wastewise

# Production (use environment variables)
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/wastewise
```

### API Security

**JWT Tokens:**
- Use strong, random secrets (min 32 characters)
- Set appropriate expiration times (access: 15min, refresh: 7 days)
- Implement token rotation
- Store refresh tokens securely

**Rate Limiting:**
- Production: 100 requests per 15 minutes (configured)
- Adjust based on your needs
- Monitor for abuse patterns

**CORS:**
- Whitelist specific origins only
- Never use `*` in production
- Update `FRONTEND_URL` in production environment

### Authentication

**Password Requirements:**
- Minimum 6 characters (increase to 8+ for production)
- Use bcrypt for hashing (already implemented)
- Implement password reset flow
- Consider 2FA for admin accounts

**Session Management:**
- Implement proper logout
- Clear tokens on logout
- Invalidate refresh tokens when needed

### File Upload Security

**Image Uploads:**
- Validate file types (already implemented)
- Limit file sizes (10MB max configured)
- Scan for malware in production
- Use Cloudinary's security features

### API Security Headers

Already implemented via Helmet.js:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

### Input Validation

**Always validate:**
- User input (using express-validator)
- File uploads
- Query parameters
- Request bodies

**Sanitize:**
- HTML content
- SQL/NoSQL injection attempts
- XSS attempts

### Production Deployment

**Checklist:**
- [ ] All secrets in environment variables
- [ ] Strong JWT secrets (32+ characters)
- [ ] HTTPS enabled
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database authentication enabled
- [ ] IP whitelisting configured
- [ ] Monitoring and logging enabled
- [ ] Regular backups scheduled
- [ ] Security headers configured

### Dependency Security

**Regular Updates:**
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

**Monitor:**
- GitHub Dependabot alerts
- npm security advisories
- CVE databases

### Code Security

**Best Practices:**
- Never log sensitive data
- Use parameterized queries
- Implement proper error handling
- Don't expose stack traces in production
- Use HTTPS for all external requests

### Monitoring and Logging

**What to Monitor:**
- Failed login attempts
- API rate limit hits
- Unusual traffic patterns
- Database connection failures
- File upload attempts

**What NOT to Log:**
- Passwords
- JWT tokens
- API keys
- Credit card numbers
- Personal identification numbers

### Incident Response

**If a secret is exposed:**

1. **Immediately rotate the secret:**
   ```bash
   # Generate new secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Update environment variables:**
   - Development: Update `.env`
   - Production: Update hosting platform environment variables

3. **Revoke compromised credentials:**
   - MongoDB Atlas: Rotate database password
   - Cloudinary: Regenerate API keys
   - Email service: Generate new app password

4. **Audit access logs:**
   - Check for unauthorized access
   - Review recent activity
   - Look for data breaches

5. **Notify affected users** if data was compromised

### GitHub Security

**Prevent secret exposure:**

1. **Use `.gitignore`:**
   ```gitignore
   .env
   .env.local
   .env.*.local
   *.pem
   *.key
   ```

2. **Enable secret scanning:**
   - GitHub automatically scans for secrets
   - Review and resolve alerts immediately
   - Use GitHub's secret scanning API

3. **Use placeholders in documentation:**
   ```env
   # Good
   API_KEY=<your-api-key-here>
   
   # Bad
   API_KEY=sk_live_51H1234567890abcdef
   ```

### Security Checklist for Contributors

Before committing:
- [ ] No secrets in code
- [ ] No credentials in documentation
- [ ] `.env` files in `.gitignore`
- [ ] Placeholders used for examples
- [ ] Input validation implemented
- [ ] Error handling in place
- [ ] Security headers configured
- [ ] Dependencies up to date

### Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### Contact

For security concerns:
- **Email**: security@wastewise.com
- **Response Time**: Within 24 hours
- **PGP Key**: Available on request

---

**Last Updated**: November 2024

**Note**: This security policy is regularly updated. Check back frequently for the latest security guidelines.
