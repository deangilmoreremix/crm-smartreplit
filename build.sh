#!/bin/bash
# Complete production build script

echo "🏗️  Building SmartCRM for production..."

# Step 1: Build client (Vite)
echo "📦 Step 1: Building client..."
npm run build:client || exit 1

# Step 2: Build server
echo "🔧 Step 2: Building server..."
node scripts/build-server.mjs || exit 1

# Step 3: Build Netlify functions
echo "⚡ Step 3: Building Netlify functions..."
npm run build:functions || exit 1

# Step 4: Verify builds
echo "✅ Step 4: Verifying builds..."
node scripts/verify-dist.mjs || exit 1

echo ""
echo "🎉 Production build complete!"
echo "   Run 'npm start' to start the production server"
