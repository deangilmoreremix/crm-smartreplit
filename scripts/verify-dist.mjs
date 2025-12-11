import fs from "node:fs";

// Verify client build (Vite builds to server/public)
if (!fs.existsSync("server/public")) {
  console.error("❌ server/public was not created. Check Vite errors above.");
  process.exit(1);
}

// Verify server build
if (!fs.existsSync("dist/index.js")) {
  console.error("❌ dist/index.js was not created. Run server build first.");
  process.exit(1);
}

console.log("✅ Production build successful!");
console.log("   - Client: server/public/");
console.log("   - Server: dist/index.js");
console.log("   - Static files: dist/public/");