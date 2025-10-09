#!/bin/bash
# Complete CORS Testing Script

echo "🧪 Testing CORS Configuration"
echo "==============================="
echo ""

# Get machine IP
MACHINE_IP=$(node -e "console.log(require('os').networkInterfaces().en0.find(i => i.family === 'IPv4').address)" 2>/dev/null)
if [ -z "$MACHINE_IP" ]; then
    MACHINE_IP="10.100.102.29"
fi

echo "📍 Machine IP: $MACHINE_IP"
echo ""

# Test 1: OPTIONS preflight
echo "1️⃣  Testing OPTIONS Preflight Request"
echo "   Endpoint: /trpc/auth.login"
echo "   Origin: http://$MACHINE_IP:6001"
curl -X OPTIONS \
  -H "Origin: http://$MACHINE_IP:6001" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  -s -D - \
  http://localhost:6001/trpc/auth.login | grep -i "access-control"
echo ""

# Test 2: POST request with CORS
echo "2️⃣  Testing POST Request with CORS Headers"
echo "   Endpoint: /trpc/auth.login"
curl -X POST \
  -H "Origin: http://$MACHINE_IP:6001" \
  -H "Content-Type: application/json" \
  -s -D - \
  "http://localhost:6001/trpc/auth.login" \
  -d '{"email":"test@example.com","password":"test123"}' | grep -i "access-control"
echo ""

# Test 3: GET request to CORS test endpoint
echo "3️⃣  Testing CORS Test Endpoint"
curl -s -H "Origin: http://$MACHINE_IP:6001" http://localhost:6001/cors-test | jq '.'
echo ""

# Test 4: Different origin
echo "4️⃣  Testing with Different Origin (example.com)"
curl -X OPTIONS \
  -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  -s -D - \
  http://localhost:6001/trpc/auth.login | grep -i "access-control-allow-origin"
echo ""

# Test 5: Check server health
echo "5️⃣  Server Health Check"
curl -s http://localhost:6001/health 2>/dev/null || echo "⚠️  Health endpoint not responding"
echo ""

echo "✅ CORS Testing Complete!"
echo ""
echo "📋 Summary:"
echo "   - All access-control headers should show the origin"
echo "   - access-control-allow-credentials should be 'true'"
echo "   - access-control-allow-headers should be '*'"
echo ""
echo "🌐 Access your application at:"
echo "   Local:  http://localhost:6001"
echo "   Remote: http://$MACHINE_IP:6001"
echo ""
echo "💡 If browser still shows CORS errors:"
echo "   1. Clear browser cache (Cmd+Shift+Delete)"
echo "   2. Open DevTools > Network tab > Disable cache"
echo "   3. Try incognito/private mode"
echo "   4. Check browser console for exact error message"
