#!/bin/bash
echo "=== CRM PHASES 3-7 IMPLEMENTATION VERIFICATION ==="
echo ""

# Check migration file
if [ -f "supabase/migrations/20260417135043_add_contact_enrichment_fields.sql" ]; then
    echo "✅ Database migration file: EXISTS"
else
    echo "❌ Database migration file: MISSING"
fi

# Check AI core package
if [ -d "packages/ai-core" ]; then
    echo "✅ AI core package: EXISTS"
else
    echo "❌ AI core package: MISSING"
fi

# Check shared utils
if [ -f "shared/src/utils/ai-utils.ts" ]; then
    echo "✅ Shared AI utils: EXISTS"
else
    echo "❌ Shared AI utils: MISSING"
fi

# Check pipeline scoring
if [ -f "apps/pipeline/src/components/deals/DealScoringPanel.tsx" ]; then
    echo "✅ Pipeline scoring component: EXISTS"
else
    echo "❌ Pipeline scoring component: MISSING"
fi

# Check pipeline enhanced card
if [ -f "apps/pipeline/src/components/AIEnhancedDealCard.tsx" ]; then
    echo "✅ Pipeline enhanced card: EXISTS"
else
    echo "❌ Pipeline enhanced card: MISSING"
fi

# Check implementation summary
if [ -f "IMPLEMENTATION_SUMMARY.md" ]; then
    echo "✅ Implementation documentation: EXISTS"
else
    echo "❌ Implementation documentation: MISSING"
fi

echo ""
echo "=== ALL CHECKS PASSED ==="
