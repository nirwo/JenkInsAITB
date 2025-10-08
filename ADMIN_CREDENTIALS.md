# Initial Super Admin Credentials

## 🔐 Login Information

### Super Admin Account
- **Email**: `admin@jenkinds.io`
- **Password**: `Admin@123456`
- **Username**: `admin`
- **Role**: ADMIN

### Demo User Account
- **Email**: `demo@jenkinds.io`
- **Password**: `Demo@123456`
- **Username**: `demo`
- **Role**: USER

## ⚠️ Security Notice

**IMPORTANT**: These are default credentials for initial setup. **Change these passwords immediately after first login**, especially in production environments!

## 🚀 How to Login

1. Open your browser and go to: **http://localhost:3000**
2. Click on "Login" or navigate to the login page
3. Enter the email and password above
4. You will be logged in with full admin privileges

## 🔧 Changing Your Password

After logging in:
1. Go to your Profile/Settings
2. Click on "Change Password"
3. Enter your current password and new password
4. Save changes

## 📝 Additional Notes

- The Super Admin has full access to all features including:
  - Managing Jenkins instances
  - Viewing all jobs and builds
  - Managing users (if user management is implemented)
  - Accessing analytics and logs
  - Configuring system settings

- The Demo User has read-only access to:
  - View Jenkins instances
  - View jobs and builds
  - View logs and analytics

## 🛠️ Database Setup

Users were created using the script: `scripts/create-admin.sh`

To recreate or reset admin user:
```bash
./scripts/create-admin.sh
```

---

**Created**: October 7, 2025  
**Status**: ✅ Active
