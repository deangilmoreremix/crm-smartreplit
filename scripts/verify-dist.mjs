import fs from "node:fs";

// Verify client build (Vite builds to server/public for Netlify)
if (!fs.existsSync("server/public")) {
  console.error("❌ server/public was not created. Check Vite errors above.");
  process.exit(1);
}

// Verify Netlify functions build
if (!fs.existsSync("netlify/functions")) {
  console.error("❌ netlify/functions was not created. Check function build errors above.");
  process.exit(1);
}

// Check if at least one function was built
const functionsDir = fs.readdirSync("netlify/functions");
if (functionsDir.length === 0) {
  console.error("❌ No functions were built in netlify/functions/. Check function build errors above.");
  process.exit(1);
}

console.log("✅ Netlify production build successful!");
console.log(`   - Client: server/public/ (${functionsDir.length} functions built)`);
console.log("   - Functions: netlify/functions/");
console.log("   - Ready for Netlify deployment!");