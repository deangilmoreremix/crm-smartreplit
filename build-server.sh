#!/bin/bash
# Build script for Replit deployment

echo "📦 Building client..."
npm run build:client

echo "🔧 Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js --alias:@shared=./shared

echo "✅ Build complete!"
