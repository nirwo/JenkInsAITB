# 🚀 Ubuntu One-Command Install

**Get JenKinds running in ~10 minutes with ONE command!**

## ⚡ Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/nirwo/JenkInsAITB/master/k8s/init-k8s.sh | bash
```

That's it! The script installs everything automatically.

## 📋 What You Need

- Ubuntu 20.04+ or Debian 11+
- Sudo access
- 4GB RAM (8GB recommended)
- 20GB disk space
- Your credentials:
  - Jenkins URL, username, API token
  - OpenAI API key

## 🎯 What It Installs

1. Docker
2. k3s Kubernetes  
3. kubectl
4. Node.js 20 + pnpm
5. JenKinds application

**Total time:** 10-15 minutes

## 🔐 During Installation

The script will prompt for:
- Jenkins credentials
- OpenAI API key
- SMTP settings (optional)
- Admin user creation (optional)

## ✅ After Installation

Access JenKinds:

```bash
kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
```

Open: http://localhost:9011

## 📚 Full Documentation

- **Complete Guide**: [K8S_DEPLOYMENT.md](K8S_DEPLOYMENT.md)
- **Manual Setup**: [k8s/README.md](k8s/README.md)
- **Secrets Config**: [k8s/SECRETS_GUIDE.md](k8s/SECRETS_GUIDE.md)

## 🐛 Troubleshooting

### Script fails?

```bash
# Download and run with debug
wget https://raw.githubusercontent.com/nirwo/JenkInsAITB/master/k8s/init-k8s.sh
chmod +x init-k8s.sh
bash -x init-k8s.sh
```

### Pods not starting?

```bash
kubectl logs -f -n jenkinds -l app=jenkinds
kubectl get events -n jenkinds
```

### Can't access?

```bash
# Check if running
kubectl get pods -n jenkinds

# Try port-forward again
kubectl port-forward -n jenkinds svc/jenkinds-service 9011:9011
```

## 🆘 Need Help?

- Check logs: `kubectl logs -f -n jenkinds -l app=jenkinds`
- GitHub Issues: https://github.com/nirwo/JenkInsAITB/issues

---

**Ready? Run this:**

```bash
curl -fsSL https://raw.githubusercontent.com/nirwo/JenkInsAITB/master/k8s/init-k8s.sh | bash
```

🎉 **That's it! You're done!**
