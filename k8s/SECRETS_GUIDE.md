# Secrets Configuration Guide

This guide helps you configure all required secrets for your JenKinds k8s deployment.

## 📝 Overview

Before deploying, you MUST update `k8s/secrets.yaml` with your actual credentials. This file contains all sensitive information needed for the application to function.

## 🔐 Required Secrets

### 1. Jenkins Configuration

```yaml
# Jenkins server URL (no trailing slash)
JENKINS_URL: "https://jenkins.yourcompany.com"

# Jenkins username
JENKINS_USER: "your-jenkins-username"

# Jenkins API token (not password!)
JENKINS_API_TOKEN: "your-jenkins-api-token"
```

**How to get Jenkins API token:**

1. Log into Jenkins
2. Click your username (top right) → Configure
3. Scroll to "API Token" section
4. Click "Add new Token"
5. Give it a name (e.g., "JenKinds")
6. Click "Generate"
7. Copy the token immediately (can't view again)

### 2. OpenAI API Key

```yaml
# OpenAI API key for AI-powered log analysis
OPENAI_API_KEY: "sk-proj-..."
```

**How to get OpenAI API key:**

1. Go to https://platform.openai.com/api-keys
2. Create an account or log in
3. Click "Create new secret key"
4. Give it a name (e.g., "JenKinds Production")
5. Copy the key immediately (starts with `sk-proj-`)

**Cost considerations:**
- Default model: `gpt-4o-mini` (cost-effective)
- Estimated cost: ~$0.01 per log analysis
- Set usage limits in OpenAI dashboard

### 3. JWT Secrets

```yaml
# JWT secret for access tokens (min 32 characters)
JWT_SECRET: "generate-a-random-secret-here"

# Refresh token secret (min 32 characters, different from JWT_SECRET)
REFRESH_TOKEN_SECRET: "generate-another-random-secret-here"
```

**How to generate secure secrets:**

```bash
# Method 1: OpenSSL (recommended)
openssl rand -base64 32

# Method 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Method 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Important:**
- Use different values for JWT_SECRET and REFRESH_TOKEN_SECRET
- Never commit these to git
- Store securely (password manager)
- Rotate regularly (every 90 days recommended)

### 4. SMTP Configuration (Optional)

```yaml
# SMTP server hostname
SMTP_HOST: "smtp.gmail.com"

# SMTP port (587 for TLS, 465 for SSL)
SMTP_PORT: "587"

# SMTP username (usually your email)
SMTP_USER: "your-email@gmail.com"

# SMTP password or app-specific password
SMTP_PASSWORD: "your-app-password"

# Email sender address
SMTP_FROM: "noreply@yourcompany.com"
```

**For Gmail:**

1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. App Passwords → Select app: "Mail", device: "Other (JenKinds)"
4. Click "Generate"
5. Use the 16-character password (no spaces)

**SMTP not needed if:**
- You're not using email notifications
- You're not using password reset features
- You can leave defaults or set to empty strings

### 5. Sentry DSN (Optional)

```yaml
# Sentry DSN for error tracking
SENTRY_DSN: "https://...@sentry.io/..."
```

**How to get Sentry DSN:**

1. Go to https://sentry.io
2. Create project (Node.js)
3. Copy the DSN from project settings
4. Or leave empty to disable Sentry

**Not needed if:**
- You don't want error tracking
- You're using other error monitoring
- Can set to empty string

## 📄 Complete Example

Here's a complete `secrets.yaml` with example values:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: jenkinds-secrets
  namespace: jenkinds
type: Opaque
stringData:
  # Jenkins Configuration (REQUIRED)
  JENKINS_URL: "https://jenkins.example.com"
  JENKINS_USER: "admin"
  JENKINS_API_TOKEN: "11234567890abcdef1234567890abcdef"
  
  # OpenAI API Key (REQUIRED for AI features)
  OPENAI_API_KEY: "sk-proj-abcdefghijklmnopqrstuvwxyz1234567890"
  
  # JWT Secrets (REQUIRED)
  JWT_SECRET: "aB3dE6gH9jK2mN5pQ8sT1vX4yZ7cF0eH3iK6mO9rU2wY5"
  REFRESH_TOKEN_SECRET: "zY9wV6tS3qP0nM7kJ4hG1fD8cB5aZ2xW9vU6tR3pO0"
  
  # SMTP Configuration (OPTIONAL)
  SMTP_HOST: "smtp.gmail.com"
  SMTP_PORT: "587"
  SMTP_USER: "jenkinds@example.com"
  SMTP_PASSWORD: "abcd efgh ijkl mnop"  # Gmail app password
  SMTP_FROM: "noreply@example.com"
  
  # Sentry (OPTIONAL)
  SENTRY_DSN: ""
```

## ✅ Validation Checklist

Before deploying, verify:

### Jenkins
- [ ] JENKINS_URL is correct and accessible
- [ ] JENKINS_USER exists and has permissions
- [ ] JENKINS_API_TOKEN is valid (not expired)
- [ ] Can access: `curl -u USER:TOKEN ${JENKINS_URL}/api/json`

### OpenAI
- [ ] OPENAI_API_KEY is valid
- [ ] Account has credits/billing set up
- [ ] Usage limits configured (optional)

### JWT Secrets
- [ ] Both secrets are at least 32 characters
- [ ] Both secrets are different from each other
- [ ] Secrets are randomly generated (not guessable)
- [ ] Secrets stored securely (password manager)

### SMTP (if using)
- [ ] SMTP credentials are correct
- [ ] Can send test email
- [ ] App password generated (not account password)

### File Security
- [ ] secrets.yaml is in .gitignore
- [ ] secrets.yaml has restricted permissions (chmod 600)
- [ ] No secrets committed to git history

## 🔧 Testing Secrets

### Test Jenkins Connection

```bash
# Replace with your values
JENKINS_URL="https://jenkins.example.com"
JENKINS_USER="admin"
JENKINS_TOKEN="your-token"

# Test API access
curl -u ${JENKINS_USER}:${JENKINS_TOKEN} ${JENKINS_URL}/api/json

# Should return JSON with Jenkins info
```

### Test OpenAI Key

```bash
# Replace with your key
OPENAI_KEY="sk-proj-..."

# Test API access
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer ${OPENAI_KEY}"

# Should return list of available models
```

### Test SMTP (with Python)

```python
import smtplib
from email.mime.text import MIMEText

smtp_host = "smtp.gmail.com"
smtp_port = 587
smtp_user = "your-email@gmail.com"
smtp_pass = "your-app-password"

try:
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_user, smtp_pass)
    print("✓ SMTP connection successful!")
    server.quit()
except Exception as e:
    print(f"✗ SMTP connection failed: {e}")
```

## 🔒 Security Best Practices

### DO:
- ✅ Use strong, randomly generated secrets
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use environment-specific secrets (dev/prod)
- ✅ Store secrets in password manager
- ✅ Restrict file permissions (chmod 600)
- ✅ Use k8s secrets (not ConfigMaps)
- ✅ Encrypt secrets at rest (k8s encryption)

### DON'T:
- ❌ Commit secrets to git
- ❌ Share secrets via email/chat
- ❌ Use simple/guessable secrets
- ❌ Reuse secrets across environments
- ❌ Log secrets in application logs
- ❌ Store secrets in ConfigMaps
- ❌ Use default/example secrets

## 🆘 Troubleshooting

### "Jenkins authentication failed"

1. Verify Jenkins URL is accessible:
   ```bash
   curl -I https://jenkins.example.com
   ```

2. Test credentials:
   ```bash
   curl -u USER:TOKEN https://jenkins.example.com/api/json
   ```

3. Check token hasn't expired (recreate if needed)

### "OpenAI API error"

1. Verify key format starts with `sk-proj-` or `sk-`
2. Check billing in OpenAI dashboard
3. Verify usage limits not exceeded
4. Test with curl (see testing section above)

### "JWT token invalid"

1. Verify both secrets are set and different
2. Check secrets are at least 32 characters
3. Restart application after updating secrets
4. Clear browser cookies/local storage

### "SMTP connection failed"

1. Verify SMTP credentials
2. For Gmail, use app password (not account password)
3. Check firewall allows outbound port 587
4. Try alternative SMTP server

## 📚 Additional Resources

- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Jenkins API Token](https://www.jenkins.io/doc/book/system-administration/authenticating-scripted-clients/)
- [OpenAI API Keys](https://platform.openai.com/docs/api-reference/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Secrets Management](https://owasp.org/www-project-secrets-management-cheat-sheet/)

---

**Ready to deploy?** Go back to [K8S_DEPLOYMENT.md](K8S_DEPLOYMENT.md) and continue with the deployment steps!
