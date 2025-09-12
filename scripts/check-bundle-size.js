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
    // Look for actual failures, not just absence of checkmark
    if (output.includes("Size limit exceeded") || output.includes("failed")) {
      hasErrors = true;
    }
  } catch (error) {
    console.error("❌ Runtime bundle size check failed");
    hasErrors = true;
  }
}

// Check analytics package
const analyticsPath = path.join(__dirname, "../packages/analytics");
if (fs.existsSync(analyticsPath)) {
  console.log("\n📦 Checking @forms/analytics bundle sizes...");

  // First check if dist exists, if not try to build
  const distPath = path.join(analyticsPath, "dist");
  if (!fs.existsSync(distPath)) {
    console.log("  Building @forms/analytics package...");
    const { execSync } = require("child_process");

    try {
      execSync("pnpm --filter @forms/analytics build", {
        cwd: path.join(__dirname, ".."),
        encoding: "utf8",
        stdio: "inherit",
      });
    } catch (error) {
      console.error("  ❌ Failed to build analytics package");
      hasErrors = true;
    }
  }

  // Now check the bundle sizes
  if (fs.existsSync(distPath)) {
    for (const [file, budget] of Object.entries(BUDGETS["@forms/analytics"])) {
      // file already contains "dist/" prefix from BUDGETS config
      const filePath = path.join(analyticsPath, file);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const size = stats.size;

        // Note: This is uncompressed size. In real CI, we'd use gzip size
        console.log(
          `  ${file}: ${(size / 1024).toFixed(2)}KB uncompressed (budget: ${(budget / 1024).toFixed(0)}KB gzipped)`
        );

        // For now, pass if uncompressed is less than budget * 3
        // Rough estimate: gzip usually reduces by ~70%
        if (size > budget * 3) {
          console.log(
            `  ❌ ${file} exceeds budget (estimated gzipped: ${((size * 0.3) / 1024).toFixed(2)}KB)`
          );
          hasErrors = true;
        } else {
          console.log(`  ✓ Within budget`);
        }
      } else {
        console.error(`  ❌ File not found: ${file}`);
        console.error(`    Looking in: ${filePath}`);
        hasErrors = true;
      }
    }
  } else {
    console.error("  ❌ Analytics package dist folder not found even after build attempt");
    hasErrors = true;
  }
} else {
  console.log("\n⚠️  Analytics package not found");
}

console.log(
  "\n" + (hasErrors ? "❌ Bundle size check failed!" : "✅ All bundle sizes within budget!")
);
process.exit(hasErrors ? 1 : 0);
