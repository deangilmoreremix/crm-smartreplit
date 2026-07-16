#!/bin/bash

# Netlify Manual Deploy Helper
# Builds and lists deploy steps for all 5 Module Federation remote apps.
# NOTE: `netlify create`/`sites:list` hang in non-interactive environments,
# so deploys must be performed via the Netlify UI or `netlify deploy --prod`.

set -e

APPS=(
  "contacts:taupe-sprinkles-83c9ee:contacts.smartcrm.vip"
  "pipeline:cheery-syrniki-b5b6ca:pipeline.smartcrm.vip"
  "analytics:dulcet-salmiakki-445c47:ai-analytics.smartcrm.vip"
  "calendar:voluble-vacherin-add80d:calendar.smartcrm.vip"
  "agency:91317337-b416-4b44-94e9-a852ed448a79:agency.smartcrm.vip"
)

echo "=========================================="
echo "  MODULE FEDERATION DEPLOYMENT"
echo "=========================================="
echo ""
echo "Step 1 - Build each remote app:"
echo ""

for entry in "${APPS[@]}"; do
  IFS=':' read -r app site domain <<< "$entry"
  echo "  cd apps/$app && npm run build"
done

echo ""
echo "Step 2 - Deploy each built dist/ folder:"
echo ""

for entry in "${APPS[@]}"; do
  IFS=':' read -r app site domain <<< "$entry"
  echo "  App: $app"
  echo "    Site:     $site"
  echo "    URL:      https://$domain"
  echo "    Dist:     apps/$app/dist/"
  echo "    Deploy:   netlify deploy --prod --no-build --dir=apps/$app/dist --site=$site"
  echo ""
done

echo "=========================================="
echo "  VERIFY"
echo "=========================================="
echo ""
echo "  node verify-mfe-remotes.js"
echo ""
echo "CORS: each apps/<app>/public/_headers allows '*' on /assets/remoteEntry.js"
echo ""
echo "=========================================="
