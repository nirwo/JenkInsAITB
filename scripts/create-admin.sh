#!/bin/bash
# Create admin user directly in PostgreSQL

echo "🔧 Creating Super Admin user..."

# Generate password hash for "Admin@123456" using Node
PASSWORD_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin@123456', 10).then(hash => console.log(hash))")

docker exec jenkinds-postgres psql -U jenkinds -d jenkinds <<EOF
-- Insert Super Admin user
INSERT INTO users (id, email, username, password_hash, role, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'admin@jenkinds.io',
  'admin',
  '${PASSWORD_HASH}',
  'ADMIN',
  'Super',
  'Admin',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Insert Demo user
EOF

PASSWORD_HASH_DEMO=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Demo@123456', 10).then(hash => console.log(hash))")

docker exec jenkinds-postgres psql -U jenkinds -d jenkinds <<EOF
INSERT INTO users (id, email, username, password_hash, role, first_name, last_name, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid()::text,
  'demo@jenkinds.io',
  'demo',
  '${PASSWORD_HASH_DEMO}',
  'USER',
  'Demo',
  'User',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
EOF

echo "✅ Users created successfully!"
echo ""
echo "📝 Login Credentials:"
echo "┌─────────────────────────────────────────────────┐"
echo "│  SUPER ADMIN                                    │"
echo "├─────────────────────────────────────────────────┤"
echo "│  Email:    admin@jenkinds.io                    │"
echo "│  Password: Admin@123456                         │"
echo "├─────────────────────────────────────────────────┤"
echo "│  DEMO USER                                      │"
echo "├─────────────────────────────────────────────────┤"
echo "│  Email:    demo@jenkinds.io                     │"
echo "│  Password: Demo@123456                          │"
echo "└─────────────────────────────────────────────────┘"
echo ""
echo "⚠️  IMPORTANT: Change these passwords in production!"
