#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const BUDGETS = {
  '@forms/runtime': {
    maxSize: 30 * 1024, // 30KB
    critical: true,
  },
  '@forms/analytics': {
    maxSize: 50 * 1024, // 50KB
    critical: false,
  },
};

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2)}KB`;
}

function checkBundleSize(packageName, config) {
  const packagePath = path.join(process.cwd(), 'packages', packageName.split('/')[1]);
  const distPath = path.join(packagePath, 'dist', 'index.js');
  
  if (!fs.existsSync(distPath)) {
    console.error(`❌ Bundle not found for ${packageName} at ${distPath}`);
    console.error('   Run "pnpm build" first');
    return false;
  }
  
  const bundle = fs.readFileSync(distPath);
  const bundleSize = bundle.length;
  const gzipSize = gzipSync(bundle).length;
  
  console.log(`\n📦 ${packageName}:`);
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
  console.log('🔍 Checking bundle sizes...\n');
  
  let hasErrors = false;
  
  for (const [packageName, config] of Object.entries(BUDGETS)) {
    const passed = checkBundleSize(packageName, config);
    if (!passed && config.critical) {
      hasErrors = true;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.error('\n❌ Critical bundle size budgets exceeded!');
    console.error('   Reduce bundle size before merging.');
    process.exit(1);
  } else {
    console.log('\n✅ All bundle sizes within budget!');
  }
}

main();