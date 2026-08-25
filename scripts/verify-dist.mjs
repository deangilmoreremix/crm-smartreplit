import fs from 'node:fs';

// Verify client build (Vite builds to server/public for Netlify)
if (!fs.existsSync('server/public')) {
  console.error('❌ server/public was not created. Check Vite errors above.');
  process.exit(1);
}

// Verify Netlify functions build
if (!fs.existsSync('netlify/functions')) {
  console.error('❌ netlify/functions was not created. Check function build errors above.');
  process.exit(1);
}

// Check if at least one function was built
const functionsDir = fs.readdirSync('netlify/functions');
if (functionsDir.length === 0) {
  console.error(
    '❌ No functions were built in netlify/functions/. Check function build errors above.'
  );
  process.exit(1);
}

// Verify the built index.html is the host app, not an MFE remote shell
const indexPath = 'server/public/index.html';
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html was not created in server/public.');
  process.exit(1);
}

const indexHtml = fs.readFileSync(indexPath, 'utf-8');

// MFE remote shells contain iframe injection scripts or remote entry references
const mfeRemoteIndicators = [
  'ContactsApp',
  'PipelineApp',
  'AnalyticsApp',
  'CalendarApp',
  'AIGoalsApp',
  'multi_analytics',
  'product_research',
  'iframe.src',
  'main.smartcrm.vip',
];

const foundMfeIndicator = mfeRemoteIndicators.find((indicator) =>
  indexHtml.includes(indicator)
);

if (foundMfeIndicator) {
  console.error(
    `❌ Detected MFE remote artifact in server/public/index.html: "${foundMfeIndicator}". ` +
      'This usually means an MFE remote build was accidentally copied into the host app publish directory.'
  );
  process.exit(1);
}

console.log('✅ Netlify production build successful!');
console.log(`   - Client: server/public/ (${functionsDir.length} functions built)`);
console.log('   - Functions: netlify/functions/');
console.log('   - Host app index.html verified');
console.log('   - Ready for Netlify deployment!');
