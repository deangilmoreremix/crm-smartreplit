#!/usr/bin/env node

/**
 * Automated URL Update Script
 * Updates netlify.app URLs to smartcrm.vip domains across the codebase
 */

const fs = require('fs');
const path = require('path');

// URL mapping configuration
const URL_MAPPING = {
  'cheery-syrniki-b5b6ca.netlify.app': 'pipeline.smartcrm.vip',
  'taupe-sprinkles-83c9ee.netlify.app': 'contacts.smartcrm.vip',
  'serene-valkyrie-fec320.netlify.app': 'agency.smartcrm.vip',
  'capable-mermaid-3c73fa.netlify.app': 'calendar.smartcrm.vip',
  'moonlit-tarsier-239e70.netlify.app': 'white-label.smartcrm.vip',
  'stupendous-twilight-64389a.netlify.app': 'analytics.smartcrm.vip',
  'clever-syrniki-4df87f.netlify.app': 'research.smartcrm.vip',
  'resilient-frangipane-6289c8.netlify.app': 'analytics.smartcrm.vip',
  'cerulean-crepe-9470cc.netlify.app': 'landing.smartcrm.vip',
};

// File patterns to process
const FILE_PATTERNS = [
  '**/*.{ts,tsx,js,jsx,json}',
  '**/*.md',
  '!node_modules/**',
  '!dist/**',
  '!.git/**',
  '!build/**',
];

// Statistics tracking
let stats = {
  filesProcessed: 0,
  filesModified: 0,
  totalReplacements: 0,
};

function updateUrlsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fileModified = false;
    let replacementsInFile = 0;

    // Apply URL replacements
    for (const [oldUrl, newUrl] of Object.entries(URL_MAPPING)) {
      const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = updatedContent.match(regex);

      if (matches) {
        updatedContent = updatedContent.replace(regex, newUrl);
        replacementsInFile += matches.length;
        fileModified = true;
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      stats.filesModified++;
      stats.totalReplacements += replacementsInFile;

      console.log(`✅ Updated ${filePath}: ${replacementsInFile} replacements`);
    }

    stats.filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

function findFiles() {
  const files = [];

  function walkDir(dir) {
    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip excluded directories
          if (['node_modules', 'dist', '.git', 'build'].includes(item)) {
            continue;
          }
          walkDir(fullPath);
        } else if (stat.isFile()) {
          // Check if file matches patterns
          const ext = path.extname(item);
          const fileName = path.basename(item);

          if (['.ts', '.tsx', '.js', '.jsx', '.json'].includes(ext) ||
              fileName === 'README.md' || fileName === 'COMMIT_DOCUMENTATION.md') {
            // Skip if it's in excluded directories (already handled by directory skip)
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  walkDir(process.cwd());

  // Remove duplicates
  return [...new Set(files)];
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-d');
  const verbose = args.includes('--verbose') || args.includes('-v');

  console.log('🔄 Automated URL Update Script');
  console.log('==============================');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN: No files will be modified');
    console.log('');
  }

  console.log('URL Mappings:');
  Object.entries(URL_MAPPING).forEach(([oldUrl, newUrl]) => {
    console.log(`  ${oldUrl} → ${newUrl}`);
  });
  console.log('');

  try {
    const files = findFiles();
    console.log(`Found ${files.length} files to process`);
    console.log('');

    if (verbose) {
      console.log('Files to process:');
      files.slice(0, 10).forEach(file => console.log(`  ${file}`));
      if (files.length > 10) {
        console.log(`  ... and ${files.length - 10} more`);
      }
      console.log('');
    }

    // Process files
    for (const file of files) {
      if (!dryRun) {
        updateUrlsInFile(file);
      } else {
        // In dry run, just count potential replacements
        try {
          const content = fs.readFileSync(file, 'utf8');
          let potentialReplacements = 0;

          for (const [oldUrl] of Object.entries(URL_MAPPING)) {
            const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = content.match(regex);
            if (matches) {
              potentialReplacements += matches.length;
            }
          }

          if (potentialReplacements > 0) {
            console.log(`🔍 Would update ${file}: ${potentialReplacements} replacements`);
            stats.filesModified++;
            stats.totalReplacements += potentialReplacements;
          }

          stats.filesProcessed++;
        } catch (error) {
          console.error(`❌ Error reading ${file}:`, error.message);
        }
      }
    }

    console.log('');
    console.log('📊 Summary:');
    console.log(`  Files processed: ${stats.filesProcessed}`);
    console.log(`  Files ${dryRun ? 'would be ' : ''}modified: ${stats.filesModified}`);
    console.log(`  Total replacements: ${stats.totalReplacements}`);

    if (!dryRun && stats.filesModified > 0) {
      console.log('');
      console.log('✅ URL updates completed successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Review the changes with `git diff`');
      console.log('2. Test the application to ensure everything works');
      console.log('3. Commit the changes: `git commit -m "feat: update URLs from netlify.app to smartcrm.vip"`');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { URL_MAPPING, updateUrlsInFile };