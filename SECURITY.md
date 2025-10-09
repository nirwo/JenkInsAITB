# Security Policy

## 🔒 Security Overview

JenkInsAITB takes security seriously. This document outlines security best practices, sensitive data handling, and how to report vulnerabilities.

---

## 🚨 Critical: Environment Variables

### ⚠️ NEVER Commit These Files:
- `.env` - Contains API keys and secrets
- `.env.local` - Local environment overrides
- `.env.production` - Production credentials
- `credentials.json` - Any credential files
- `*.pem`, `*.key`, `*.cert` - SSL certificates and keys
- Jenkins API tokens

### ✅ Always Use `.env.example`
The repository includes `.env.example` as a template. To set up:

```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
nano .env  # or use your preferred editor

# NEVER commit .env!
git status  # Verify .env is NOT in the staged files
```

---

## 🔑 API Keys & Tokens

### OpenAI API Key
```bash
OPENAI_API_KEY=sk-proj-...your-key-here
```
- **Where to get it**: https://platform.openai.com/api-keys
- **Risk**: If exposed, someone can use your API quota and incur charges
- **Action if exposed**: 
  1. Immediately revoke the key at OpenAI dashboard
  2. Generate a new key
  3. Update your `.env` file
  4. If committed to git, follow the "Key Compromised" section below

### Jenkins API Token
```bash
JENKINS_API_TOKEN=your-jenkins-token
```
- **Where to get it**: Jenkins → User → Configure → API Token
- **Risk**: Full access to your Jenkins instance
- **Action if exposed**:
  1. Revoke the token in Jenkins immediately
  2. Generate a new token
  3. Update your `.env` file

### JWT Secrets
```bash
JWT_SECRET=your-super-secret-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-this
```
- **Generate strong secrets**:
  ```bash
  # Generate a secure random string
  openssl rand -base64 32
  ```
- **Risk**: Session hijacking, authentication bypass
- **Action if exposed**: Change immediately and invalidate all sessions

---

## 🔐 Sensitive Files Protected by .gitignore

The following file patterns are automatically ignored:

### 1. Environment Files
- `.env`, `.env.*` (except `.env.example`)
- `config/local.json`
- `config/production.json`
- `secrets.json`

### 2. Credentials & Keys
- `*.pem`, `*.key`, `*.cert`, `*.crt`
- `*.p12`, `*.pfx`
- `*_rsa`, `*_rsa.pub`
- `*.ssh`
- `jenkins.token`
- `.jenkins-credentials`
- `api-token.txt`

### 3. Database Files
- `*.db`, `*.sqlite`, `*.sqlite3`
- `prisma/dev.db`
- `*.db-shm`, `*.db-wal`

### 4. Session & Auth Tokens
- `.session`
- `session.json`
- `token.json`
- `refresh_token.json`

---

## 🛡️ Security Best Practices

### For Development

1. **Use Strong Secrets**
   ```bash
   # Generate secure random strings
   JWT_SECRET=$(openssl rand -base64 32)
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

2. **Enable HTTPS Locally** (for testing)
   ```bash
   # Generate self-signed certificate
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
   ```

3. **Never Log Sensitive Data**
   ```typescript
   // ❌ BAD
   console.log('API Key:', process.env.OPENAI_API_KEY);
   
   // ✅ GOOD
   console.log('API Key:', process.env.OPENAI_API_KEY ? '[REDACTED]' : 'Not set');
   ```

4. **Validate Input**
   ```typescript
   // Always validate and sanitize user input
   import { z } from 'zod';
   
   const schema = z.object({
     buildId: z.string().uuid(),
     logQuery: z.string().max(1000),
   });
   ```

### For Production

1. **Change ALL Default Secrets**
   - Generate new JWT_SECRET
   - Generate new SESSION_SECRET
   - Use unique passwords for all services

2. **Use Environment-Specific Configs**
   ```bash
   NODE_ENV=production
   DATABASE_URL="postgresql://user:pass@prod-db:5432/jenkinds"
   JENKINS_URL=https://jenkins.yourcompany.com
   ```

3. **Enable Rate Limiting**
   ```bash
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW=60000
   ```

4. **Use Proper CORS**
   ```bash
   CORS_ORIGIN=https://jenkinds.yourcompany.com
   ```

5. **Enable Monitoring**
   ```bash
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
   ENABLE_METRICS=true
   ```

6. **Use a Proper Database**
   - Don't use SQLite in production
   - Use PostgreSQL, MySQL, or similar
   - Enable SSL for database connections

7. **Secure Jenkins Connection**
   ```bash
   # Always use HTTPS for Jenkins
   JENKINS_URL=https://jenkins.yourcompany.com
   
   # Use restricted API tokens (not admin credentials)
   JENKINS_API_TOKEN=token-with-minimal-required-permissions
   ```

---

## 🚨 If a Key Was Compromised

### If you accidentally committed sensitive data:

#### Option 1: Remove from Latest Commit (if not pushed)
```bash
# Remove the file from git
git rm --cached .env

# Commit the removal
git commit --amend -m "Remove sensitive file"
```

#### Option 2: Remove from History (if already pushed) ⚠️ DANGEROUS
```bash
# Install BFG Repo-Cleaner
brew install bfg  # macOS
# or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove the sensitive file from all history
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (⚠️ requires coordination with team)
git push --force
```

#### Option 3: Contact GitHub Support
If the key was pushed to a public repository, also:
1. Go to https://github.com/nirwo/JenkInsAITB/settings
2. Contact GitHub Support to request sensitive data removal
3. Provide the commit SHA containing the sensitive data

### After Removal:
1. ✅ Revoke all exposed keys immediately
2. ✅ Generate new keys
3. ✅ Update `.env` file
4. ✅ Verify `.gitignore` is working: `git status`
5. ✅ Monitor for unauthorized usage

---

## 🔍 Verify Your Security

Run this checklist before committing:

```bash
# 1. Check that .env is ignored
git check-ignore -v .env
# Should output: .gitignore:20:.env    .env

# 2. Verify no sensitive files are staged
git status
# .env should NOT appear in the output

# 3. Search for potential leaked keys in staged files
git diff --cached | grep -iE "(api_key|token|secret|password)"
# Should return nothing

# 4. Check for accidentally added sensitive files
git ls-files | grep -iE "(\.env$|\.pem$|\.key$|token|secret)"
# Should only show .env.example

# 5. Verify gitignore is working
echo "test-secret-file.pem" > test-secret-file.pem
git status --short
# Should NOT show the test file
rm test-secret-file.pem
```

---

## 🐛 Reporting Security Vulnerabilities

If you discover a security vulnerability, please:

### DO NOT:
- ❌ Open a public GitHub issue
- ❌ Discuss publicly in forums/chat
- ❌ Commit a fix without notifying maintainers first

### DO:
1. ✅ Email the maintainer directly: [Your Email Here]
2. ✅ Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. ✅ Allow 48 hours for initial response

### We will:
- Confirm receipt within 48 hours
- Investigate and provide updates
- Credit you in the security advisory (if desired)
- Coordinate disclosure timeline

---

## 📋 Security Checklist for Contributors

Before submitting a PR:

- [ ] No API keys or tokens in code
- [ ] No hardcoded passwords or secrets
- [ ] `.env` is not committed
- [ ] Sensitive data is properly sanitized in logs
- [ ] Input validation is in place
- [ ] SQL injection prevention (using Prisma ORM)
- [ ] XSS prevention (React handles most of this)
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Error messages don't leak sensitive info

---

## 🔐 Security Features

### Built-in Security:

1. **Authentication**
   - JWT-based authentication
   - Secure password hashing (bcrypt)
   - Session management

2. **API Security**
   - Rate limiting
   - CORS configuration
   - Input validation (Zod)
   - SQL injection prevention (Prisma)

3. **Data Protection**
   - Environment variable isolation
   - Secrets not logged
   - Secure database connections

4. **Infrastructure**
   - HTTPS support
   - Docker security best practices
   - Least privilege principle

---

## 📚 Resources

### Security Tools:
- [git-secrets](https://github.com/awslabs/git-secrets) - Prevents committing secrets
- [truffleHog](https://github.com/trufflesecurity/trufflehog) - Scans for leaked secrets
- [gitleaks](https://github.com/gitleaks/gitleaks) - Detect hardcoded secrets
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Remove sensitive data from git history

### Best Practices:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## 📞 Contact

For security concerns: [Your Contact Information]

**Repository**: https://github.com/nirwo/JenkInsAITB

---

## 📝 Version History

- **2025-10-09**: Enhanced .gitignore with comprehensive exclusions
- **2025-10-08**: Initial security policy created

---

**Remember**: Security is everyone's responsibility. When in doubt, ask! 🔒
