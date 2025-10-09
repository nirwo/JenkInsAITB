# 👤 User Management Guide

Complete guide for managing admin users in JenKinds.

## Quick Commands

```bash
# Create admin user (interactive)
pnpm create:admin

# Create admin user (command line)
tsx scripts/create-admin.ts <username> <email> <password>

# Reset password
pnpm reset:password <username> <new-password>

# List all users
pnpm list:users

# Delete user
pnpm delete:user <username>
```

---

## Password Requirements

### Minimum Requirements
- **Length**: At least 8 characters (12+ recommended)
- **Complexity**: Must include at least 3 of:
  - Lowercase letters (a-z)
  - Uppercase letters (A-Z)
  - Numbers (0-9)
  - Symbols (!@#$%^&*_-+=)

### Password Strength
- **Weak**: ❌ Rejected (less than 3 character types)
- **Medium**: ⚠️ Accepted (3 character types)
- **Strong**: ✅ Recommended (all 4 character types)

### Examples

**❌ Too Weak** (will be rejected):
```bash
# Only lowercase and numbers (2 types)
password123

# Only lowercase (1 type)
mypassword

# Too short
Pass1!
```

**⚠️ Medium** (accepted with warning):
```bash
# Lowercase, uppercase, numbers (3 types)
MyPassword123

# Lowercase, numbers, symbols (3 types)
mypass123!
```

**✅ Strong** (recommended):
```bash
# All 4 types: lowercase, uppercase, numbers, symbols
MySecurePass123!
AdminUser@2025
JenkinsDB#Admin99
```

---

## Creating Your First Admin User

### Method 1: Interactive (Recommended)

```bash
pnpm create:admin
```

This will prompt you for:
- Username (3+ characters, alphanumeric + hyphens/underscores)
- Email (valid email format)
- First Name (optional)
- Last Name (optional)
- Password (hidden input, 8+ characters)
- Password Confirmation

**Example interaction:**
```
Enter admin username: admin
Enter admin email: admin@company.com
Enter first name (optional): John
Enter last name (optional): Doe
Enter password: ********
Confirm password: ********

✓ Password strength: Strong

⚙️  Creating admin user...

✅ Admin user created successfully!

═══════════════════════════════════════════════════════════════
Login credentials:
  Username: admin
  Email:    admin@company.com
  Role:     ADMIN
═══════════════════════════════════════════════════════════════

🚀 You can now login at: http://localhost:9011
```

### Method 2: Command Line (Quick)

```bash
tsx scripts/create-admin.ts admin admin@company.com "MySecurePass123!"
```

**Important**: Quote passwords with special characters!

---

## Resetting a Password

If you forgot your password or need to update it:

```bash
# Interactive
pnpm reset:password

# Command line
tsx scripts/reset-password.ts admin "MyNewPassword123!"
```

**Example:**
```bash
$ tsx scripts/reset-password.ts admin "JenkinsAdmin@2025"

Password strength: Strong ✓

Found user: admin (admin@company.com)

⚙️  Updating password...

✅ Password updated successfully!

═══════════════════════════════════════════════════════════════
You can now login with:
  Username: admin
  Email:    admin@company.com
  New Password: (the one you just set)
═══════════════════════════════════════════════════════════════

🚀 Login at: http://localhost:9011
```

---

## Listing Users

See all users in the system:

```bash
pnpm list:users
```

**Example output:**
```
╔════════════════════════════════════════════════════════════════╗
║                    User List - JenkInsAITB                     ║
╚════════════════════════════════════════════════════════════════╝

Total users: 2

1. admin
   Email:      admin@company.com
   Role:       ADMIN
   Status:     🟢 Active
   Created:    1/9/2025, 10:30:45 AM
   Last Login: 1/9/2025, 2:15:30 PM
   ID:         abc123...

2. viewer
   Email:      viewer@company.com
   Role:       VIEWER
   Status:     🟢 Active
   Created:    1/9/2025, 11:20:10 AM
   Last Login: Never
   ID:         def456...
```

---

## Deleting a User

```bash
pnpm delete:user <username>
```

**Example:**
```bash
$ tsx scripts/delete-user.ts oldadmin

⚠️  You are about to delete:
   Username: oldadmin
   Email:    old@company.com
   Role:     ADMIN
   ID:       xyz789...

This action cannot be undone!

✅ User 'oldadmin' deleted successfully!
```

---

## Common Scenarios

### Scenario 1: First Time Setup

```bash
# 1. Setup database
pnpm setup:db

# 2. Create admin user
pnpm create:admin

# 3. Verify setup
pnpm list:users
```

### Scenario 2: Password Too Short Error

```bash
$ tsx scripts/create-admin.ts admin admin@test.com "test123"

❌ Password must be at least 8 characters long!
   Recommendation: Use 12+ characters with mixed case, numbers, and symbols
```

**Solution**: Use a longer, stronger password:
```bash
tsx scripts/create-admin.ts admin admin@test.com "TestUser123!"
```

### Scenario 3: User Already Exists

```bash
$ tsx scripts/create-admin.ts admin admin@test.com "MyPass123!"

⚠️  User with this username or email already exists!
   Existing: admin (admin@test.com)

   To update, delete the user first or use interactive mode.
```

**Solutions:**

Option 1 - Delete and recreate:
```bash
tsx scripts/delete-user.ts admin
tsx scripts/create-admin.ts admin admin@test.com "MyPass123!"
```

Option 2 - Reset password:
```bash
tsx scripts/reset-password.ts admin "MyNewPass123!"
```

Option 3 - Use interactive mode (allows updating):
```bash
pnpm create:admin
# Choose 'y' when asked to update existing user
```

### Scenario 4: Forgot Username

```bash
# List all users to see usernames
pnpm list:users
```

---

## Username Requirements

- **Minimum length**: 3 characters
- **Allowed characters**: 
  - Letters (a-z, A-Z)
  - Numbers (0-9)
  - Hyphens (-)
  - Underscores (_)
- **Not allowed**:
  - Spaces
  - Special characters (except - and _)
  - Unicode characters

### Valid Usernames
✅ `admin`
✅ `john_doe`
✅ `user-123`
✅ `AdminUser`

### Invalid Usernames
❌ `ad` (too short)
❌ `admin user` (contains space)
❌ `admin@123` (contains @)
❌ `user.name` (contains .)

---

## Email Requirements

Must be a valid email format:
- Contains `@`
- Has domain name
- Has TLD (e.g., .com, .org)

### Valid Emails
✅ `admin@company.com`
✅ `user+tag@example.org`
✅ `first.last@subdomain.example.com`

### Invalid Emails
❌ `admin@` (no domain)
❌ `admin.com` (no @)
❌ `@company.com` (no local part)

---

## Troubleshooting

### Error: "Prisma Client not generated"

```bash
# Generate Prisma client
pnpm db:generate

# Try again
pnpm create:admin
```

### Error: "Database connection failed"

```bash
# Push schema to database
pnpm db:push

# Try again
pnpm create:admin
```

### Error: "bcrypt not found"

```bash
# Install dependencies
pnpm install

# Try again
pnpm create:admin
```

### Password Not Hidden in Terminal

This is normal for some terminals. The password is still being captured, it just shows asterisks (*) or is hidden completely.

If using command-line mode, make sure to quote your password:
```bash
tsx scripts/create-admin.ts admin admin@test.com "MyPass123!"
```

---

## Security Best Practices

### Password Guidelines
1. **Never use common passwords**: password, admin, 123456, etc.
2. **Use unique passwords**: Don't reuse passwords from other sites
3. **Use a password manager**: Generate and store strong passwords
4. **Change default passwords**: Immediately after first setup
5. **Regular rotation**: Change passwords periodically

### Recommended Password Format
```
[Service][Purpose][Year][Symbol][Numbers]

Examples:
JenkinsAdmin2025!99
JenKindsDB#2025
MonitorApp@Admin25
```

### Storage Security
- Passwords are hashed with **bcrypt** (10 rounds)
- Original passwords are **never stored**
- Hashes are **one-way** (cannot be reversed)
- Database is **SQLite** file at `prisma/dev.db`

### Admin Account Security
- Limit number of admin accounts
- Use specific admin accounts for different people
- Disable unused accounts
- Monitor last login times
- Review admin actions in audit logs

---

## Scripts Reference

All user management scripts are in `scripts/` directory:

| Script | Purpose | Usage |
|--------|---------|-------|
| `create-admin-interactive.ts` | Interactive admin creation | `pnpm create:admin` |
| `create-admin.ts` | CLI admin creation | `tsx scripts/create-admin.ts <user> <email> <pass>` |
| `reset-password.ts` | Reset user password | `tsx scripts/reset-password.ts <user> <newpass>` |
| `list-users.ts` | List all users | `pnpm list:users` |
| `delete-user.ts` | Delete a user | `tsx scripts/delete-user.ts <user>` |

---

## Need Help?

### Check Current Users
```bash
pnpm list:users
```

### Test Database Connection
```bash
pnpm db:studio
```

### View Database File
```bash
ls -lh prisma/dev.db
```

### Check Logs
```bash
tail -f logs/combined.log
```

---

**Next Steps After Creating Admin:**
1. Login at `http://localhost:9011`
2. Configure Jenkins instances
3. Set up monitoring
4. Create additional users with appropriate roles (VIEWER, USER)

