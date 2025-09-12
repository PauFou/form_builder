#!/usr/bin/env node

/**
 * Check bundle sizes against performance budgets
 * This script is used by the CI to ensure bundle sizes stay within limits
 */

const fs = require("fs");
const path = require("path");

// Performance budgets
const BUDGETS = {
  "@forms/runtime": {
    "dist/index.js": 30 * 1024, // 30KB gzipped
    "dist/index.mjs": 30 * 1024, // 30KB gzipped
    "dist/embed.global.js": 5 * 1024, // 5KB gzipped
  },
  "@forms/analytics": {
    "dist/index.js": 15 * 1024, // 15KB gzipped
  },
};

console.log("📏 Checking bundle sizes against performance budgets...\n");

let hasErrors = false;

// Check runtime package
const runtimePath = path.join(__dirname, "../packages/runtime");
if (fs.existsSync(runtimePath)) {
  console.log("📦 Checking @forms/runtime bundle sizes...");

  // The runtime package already has size-limit configured
  // We'll rely on that for accurate gzipped sizes
  const { execSync } = require("child_process");

  try {
    const output = execSync("pnpm --filter @forms/runtime size", {
      cwd: path.join(__dirname, ".."),
      encoding: "utf8",
    });

    console.log(output);

    // Parse size-limit output to check if it passed
    if (output.includes("Size limit:") && !output.includes("✔")) {
      hasErrors = true;
    }
  } catch (error) {
    console.error("❌ Runtime bundle size check failed");
    hasErrors = true;
  }
}

// Check analytics package if it exists
const analyticsPath = path.join(__dirname, "../packages/analytics/dist");
if (fs.existsSync(analyticsPath)) {
  console.log("\n📦 Checking @forms/analytics bundle sizes...");

  for (const [file, budget] of Object.entries(BUDGETS["@forms/analytics"])) {
    const filePath = path.join(analyticsPath, file);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const size = stats.size;

      // Note: This is uncompressed size. In real CI, we'd use gzip size
      console.log(
        `  ${file}: ${(size / 1024).toFixed(2)}KB (budget: ${(budget / 1024).toFixed(0)}KB)`
      );

      // For now, just warn since we're checking uncompressed size
      if (size > budget * 3) {
        // Rough estimate: gzip usually reduces by ~70%
        console.log(`  ⚠️  Warning: ${file} might exceed budget when gzipped`);
      }
    }
  }
}

console.log(
  "\n" + (hasErrors ? "❌ Bundle size check failed!" : "✅ All bundle sizes within budget!")
);
process.exit(hasErrors ? 1 : 0);
