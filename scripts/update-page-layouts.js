#!/usr/bin/env node

/**
 * Batch Update Script for Page Layout Standardization
 *
 * This script updates all internal navbar dropdown pages to use the new PageLayout component
 * with glass morphism design, replacing inconsistent layouts with standardized ones.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// List of all pages to update (28 total internal navbar pages)
const pagesToUpdate = [
  // Sales Pages (10 total - 3 already done)
  'client/src/pages/PipelineHealthDashboard.tsx',
  'client/src/pages/SalesCycleAnalytics.tsx',
  'client/src/pages/WinRateIntelligence.tsx',
  'client/src/pages/AISalesForecast.tsx',
  'client/src/pages/LiveDealAnalysis.tsx',
  'client/src/pages/CompetitorInsights.tsx',
  'client/src/pages/RevenueIntelligence.tsx',

  // Communication Pages (11 total)
  'client/src/pages/CommunicationHub.tsx',
  'client/src/pages/ActivityAnalytics.tsx',
  'client/src/pages/ResponseIntelligence.tsx',
  'client/src/pages/ChannelSyncHub.tsx',
  'client/src/pages/SmartEmailOptimizer.tsx',
  'client/src/pages/SentimentMonitor.tsx',
  'client/src/pages/CommPerformance.tsx',
  'client/src/pages/PhoneSystem.tsx',
  'client/src/pages/TextMessagingDashboard.tsx',
  'client/src/pages/VideoEmailDashboard.tsx',
  'client/src/pages/AppointmentsDashboard.tsx',

  // White Label Pages (6 total)
  'client/src/pages/CompanyAdminDashboard.tsx',
  'client/src/pages/WhiteLabelManagementDashboard.tsx',
  'client/src/pages/WhiteLabelPackageBuilder.tsx',
  'client/src/pages/RevenueSharingPage.tsx',
  'client/src/pages/PartnerDashboard.tsx',
  'client/src/pages/PartnerOnboardingPage.tsx',

  // Analytics Page (1 total)
  'client/src/pages/AnalyticsDashboard.tsx'
];

function updatePageLayout(filePath) {
  try {
    console.log(`📄 Updating ${filePath}...`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already updated
    if (content.includes("import PageLayout from '../components/PageLayout'")) {
      console.log(`   ⏭️  Already updated, skipping...`);
      return;
    }

    // Add PageLayout import
    const importPattern = /import React.*from 'react';\n/;
    if (!importPattern.test(content)) {
      console.log(`   ❌ Could not find React import pattern in ${filePath}`);
      return;
    }

    content = content.replace(
      importPattern,
      (match) => `${match}import PageLayout from '../components/PageLayout';\n`
    );

    // Extract title and description from existing header
    const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const descriptionMatch = content.match(/<p[^>]*className="[^"]*text-gray-[^"]*"[^>]*>([^<]+)<\/p>/);

    const title = titleMatch ? titleMatch[1].trim() : 'Page Title';
    const description = descriptionMatch ? descriptionMatch[1].trim() : null;

    // Look for action badges in header
    const actionMatch = content.match(/<Badge[^>]*>[\s\S]*?<\/Badge>/);
    const actions = actionMatch ? actionMatch[0] : null;

    // Replace the main container structure
    const containerPattern = /<div className="min-h-screen w-full px-4 sm:px-6 lg:px-8 py-8 pt-24 bg-white dark:bg-gray-900"[^>]*>\s*<div className="max-w-7xl mx-auto space-y-8">\s*<!-- Header -->\s*<div className="flex items-center justify-between">\s*<div>\s*<h1[^>]*>([\s\S]*?)<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>\s*(<div[^>]*>[\s\S]*?<\/div>)?\s*<\/div>/;

    const replacement = `<PageLayout
      title="${title.replace(/"/g, '\\"')}"
      ${description ? `description="${description.replace(/"/g, '\\"')}"` : ''}
      ${actions ? `actions={${actions}}` : ''}
    >`;

    content = content.replace(containerPattern, replacement);

    // Fix closing tags
    content = content.replace(
      /<\/div>\s*<\/div>\s*\);\s*};$/,
      '</PageLayout>\n  );\n};'
    );

    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   ✅ Successfully updated ${filePath}`);

  } catch (error) {
    console.error(`   ❌ Error updating ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Starting batch page layout updates...\n');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const pagePath of pagesToUpdate) {
    try {
      if (fs.existsSync(pagePath)) {
        updatePageLayout(pagePath);
        successCount++;
      } else {
        console.log(`⚠️  File not found: ${pagePath}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to process ${pagePath}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Update Summary:`);
  console.log(`   ✅ Successfully updated: ${successCount} pages`);
  console.log(`   ⏭️  Skipped (already updated): ${skipCount} pages`);
  console.log(`   ❌ Errors: ${errorCount} pages`);
  console.log(`\n🎉 Page layout standardization complete!`);
  console.log(`\nNext steps:`);
  console.log(`1. Run 'npm run dev' to test the changes`);
  console.log(`2. Check each updated page for proper rendering`);
  console.log(`3. Verify glass morphism effects are working`);
  console.log(`4. Test responsive design on different screen sizes`);
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updatePageLayout, main };