#!/bin/bash
set -e

echo "🗑️  Removing dead code from entitlements migration..."

# 1. Remove requireProductTier and requireTier from auth.ts
echo "📝 Cleaning server/routes/auth.ts..."
cat > /tmp/clean-auth.js << 'NODE'
const fs = require('fs');
const lines = fs.readFileSync('server/routes/auth.ts', 'utf8').split('\n');

// Find and remove requireProductTier (starts at line 177 comment, ends before requireAdmin)
// and requireTier (starts at line 258 comment)
// Strategy: Keep everything up to line 176 (before requireProductTier JSDoc)
// Then skip to line start

let result = [];
let skipUntil = -1;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Start skipping at requireProductTier JSDoc
  if (lineNum === 177 && line.includes('* requireProductTier Middleware')) {
    skipUntil = 257; // skip until before requireAdmin
    continue;
  }
  
  // Start skipping at requireTier JSDoc  
  if (lineNum === 258 && line.includes('* requireTier Middleware')) {
    skipUntil = 336; // skip until end of function
    continue;
  }
  
  // Stop skipping when we reach the next section
  if (skipUntil > 0 && lineNum > skipUntil) {
    skipUntil = -1;
    // Fall through and include this line
  }
  
  if (skipUntil === -1) {
    result.push(line);
  }
}

// Also clean up any double blank lines left behind
const cleaned = result.join('\n').replace(/\n{3,}/g, '\n\n');

fs.writeFileSync('server/routes/auth.ts', cleaned);
console.log('✅ Cleaned server/routes/auth.ts');
NODE
node /tmp/clean-auth.js

# 2. Delete server/routes.ts
if [ -f "server/routes.ts" ]; then
  echo "🗑️  Deleting server/routes.ts (dead monolithic router)..."
  rm server/routes.ts
  echo "✅ Deleted server/routes.ts"
else
  echo "⚠️  server/routes.ts not found (already deleted?)"
fi

# 3. Verify no remaining references
echo ""
echo "🔍 Checking for remaining references to requireProductTier or requireTier..."
if grep -r "requireProductTier\|requireTier" server/ 2>/dev/null | grep -v "DEAD_CODE_REMOVAL_PLAN.md"; then
  echo "⚠️  Found remaining references (review manually):"
  grep -r "requireProductTier\|requireTier" server/ | grep -v "DEAD_CODE_REMOVAL" || true
else
  echo "✅ No remaining references found"
fi

echo ""
echo "✨ Dead code removal complete!"
echo "📋 Next: Run 'npm run build' to verify everything still compiles"
