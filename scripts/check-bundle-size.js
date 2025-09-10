#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { gzipSync } = require("zlib");

const BUDGETS = {
  "@forms/runtime-main": {
    path: "packages/runtime/dist/index.js",
    maxSize: 30 * 1024, // 30KB
    critical: true,
    name: "@forms/runtime (main)",
  },
  "@forms/runtime-esm": {
    path: "packages/runtime/dist/index.mjs",
    maxSize: 30 * 1024, // 30KB
    critical: true,
    name: "@forms/runtime (ESM)",
  },
  "@forms/runtime-embed": {
    path: "packages/runtime/dist/embed.js",
    maxSize: 5 * 1024, // 5KB
    critical: true,
    name: "@forms/runtime (embed)",
  },
};

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)}KB`;
}

function checkBundleSize(packageId, config) {
  const distPath = path.join(process.cwd(), config.path);

  if (!fs.existsSync(distPath)) {
    console.error(`❌ Bundle not found for ${config.name} at ${distPath}`);
    console.error('   Run "pnpm build" first');
    return false;
  }

  const bundle = fs.readFileSync(distPath);
  const bundleSize = bundle.length;
  const gzipSize = gzipSync(bundle).length;

  console.log(`\n📦 ${config.name}:`);
  console.log(`   Raw size: ${formatBytes(bundleSize)}`);
  console.log(`   Gzip size: ${formatBytes(gzipSize)}`);
  console.log(`   Budget: ${formatBytes(config.maxSize)}`);

  if (gzipSize > config.maxSize) {
    console.error(`   ❌ Bundle size exceeds budget by ${formatBytes(gzipSize - config.maxSize)}`);
    return false;
  } else {
    const remaining = config.maxSize - gzipSize;
    console.log(`   ✅ Within budget (${formatBytes(remaining)} remaining)`);
    return true;
  }
}

function main() {
  console.log("🔍 Checking bundle sizes...\n");

  let hasErrors = false;
  const reportData = {
    packages: [],
    timestamp: new Date().toISOString(),
  };

  for (const [packageId, config] of Object.entries(BUDGETS)) {
    const passed = checkBundleSize(packageId, config);

    // Add to report data
    const distPath = path.join(process.cwd(), config.path);
    if (fs.existsSync(distPath)) {
      const bundle = fs.readFileSync(distPath);
      const gzipSize = gzipSync(bundle).length;
      reportData.packages.push({
        name: config.name,
        size: formatBytes(bundle.length),
        gzipped: formatBytes(gzipSize),
        status: passed ? "pass" : "fail",
        budget: formatBytes(config.maxSize),
      });
    }

    if (!passed && config.critical) {
      hasErrors = true;
    }
  }

  // Write report for CI
  fs.writeFileSync("bundle-analysis.json", JSON.stringify(reportData, null, 2));

  console.log("\n" + "=".repeat(50));

  if (hasErrors) {
    console.error("\n❌ Critical bundle size budgets exceeded!");
    console.error("   Reduce bundle size before merging.");
    process.exit(1);
  } else {
    console.log("\n✅ All bundle sizes within budget!");
  }
}

main();
