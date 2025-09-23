#!/usr/bin/env node

/**
 * SKEMYA Web Vitals Compliance Checker
 *
 * Verifies that the runtime meets SKEMYA performance requirements:
 * - Bundle size < 30KB gzipped
 * - Critical performance thresholds
 * - Accessibility compliance
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const zlib = require("zlib");

const SKEMYA_REQUIREMENTS = {
  BUNDLE_SIZE_LIMIT: 30 * 1024, // 30KB
  LCP_LIMIT: 2500, // 2.5s
  INP_LIMIT: 200, // 200ms
  A11Y_SCORE: 90, // 90%
};

const COLORS = {
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  RESET: "\x1b[0m",
  BOLD: "\x1b[1m",
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.RESET}`);
}

function checkBundleSize() {
  log(COLORS.BLUE, "\n📦 Checking bundle sizes...");

  const results = {
    runtime: null,
    ui: null,
    compliance: true,
  };

  // Check runtime package bundle
  const runtimeDistPath = path.join(__dirname, "../packages/runtime/dist");
  if (fs.existsSync(runtimeDistPath)) {
    const files = fs.readdirSync(runtimeDistPath).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(runtimeDistPath, file);
      const content = fs.readFileSync(filePath);
      const gzipped = zlib.gzipSync(content);
      const size = gzipped.length;

      if (file.includes("index") || file.includes("main")) {
        results.runtime = { file, size, sizeMB: (size / 1024).toFixed(2) };

        if (size > SKEMYA_REQUIREMENTS.BUNDLE_SIZE_LIMIT) {
          log(
            COLORS.RED,
            `❌ Runtime bundle too large: ${file} (${(size / 1024).toFixed(2)}KB > 30KB)`
          );
          results.compliance = false;
        } else {
          log(
            COLORS.GREEN,
            `✅ Runtime bundle size OK: ${file} (${(size / 1024).toFixed(2)}KB < 30KB)`
          );
        }
      }
    }
  } else {
    log(COLORS.YELLOW, "⚠️  Runtime dist folder not found. Run `pnpm build` first.");
  }

  // Check UI package bundle (if built)
  const uiDistPath = path.join(__dirname, "../packages/ui/dist");
  if (fs.existsSync(uiDistPath)) {
    const files = fs.readdirSync(uiDistPath).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      const filePath = path.join(uiDistPath, file);
      const content = fs.readFileSync(filePath);
      const gzipped = zlib.gzipSync(content);
      const size = gzipped.length;

      if (file.includes("index") || file.includes("main")) {
        results.ui = { file, size, sizeMB: (size / 1024).toFixed(2) };
        log(COLORS.BLUE, `📊 UI bundle size: ${file} (${(size / 1024).toFixed(2)}KB)`);
      }
    }
  }

  return results;
}

function checkWebVitalsThresholds() {
  log(COLORS.BLUE, "\n⚡ Checking Web Vitals thresholds...");

  const thresholdsFile = path.join(__dirname, "../packages/ui/src/hooks/use-web-vitals.ts");

  if (!fs.existsSync(thresholdsFile)) {
    log(COLORS.RED, "❌ Web Vitals hook not found");
    return false;
  }

  const content = fs.readFileSync(thresholdsFile, "utf8");

  // Check LCP threshold
  const lcpMatch = content.match(/lcp:\s*{\s*good:\s*(\d+)/);
  if (lcpMatch) {
    const lcpThreshold = parseInt(lcpMatch[1]);
    if (lcpThreshold <= SKEMYA_REQUIREMENTS.LCP_LIMIT) {
      log(
        COLORS.GREEN,
        `✅ LCP threshold OK: ${lcpThreshold}ms <= ${SKEMYA_REQUIREMENTS.LCP_LIMIT}ms`
      );
    } else {
      log(
        COLORS.RED,
        `❌ LCP threshold too high: ${lcpThreshold}ms > ${SKEMYA_REQUIREMENTS.LCP_LIMIT}ms`
      );
      return false;
    }
  }

  // Check INP threshold
  const inpMatch = content.match(/inp:\s*{\s*good:\s*(\d+)/);
  if (inpMatch) {
    const inpThreshold = parseInt(inpMatch[1]);
    if (inpThreshold <= SKEMYA_REQUIREMENTS.INP_LIMIT) {
      log(
        COLORS.GREEN,
        `✅ INP threshold OK: ${inpThreshold}ms <= ${SKEMYA_REQUIREMENTS.INP_LIMIT}ms`
      );
    } else {
      log(
        COLORS.RED,
        `❌ INP threshold too high: ${inpThreshold}ms > ${SKEMYA_REQUIREMENTS.INP_LIMIT}ms`
      );
      return false;
    }
  }

  return true;
}

function checkAccessibilitySetup() {
  log(COLORS.BLUE, "\n♿ Checking accessibility setup...");

  // Check if Storybook has a11y addon
  const storybookConfig = path.join(__dirname, "../packages/ui/.storybook/main.ts");
  if (fs.existsSync(storybookConfig)) {
    const content = fs.readFileSync(storybookConfig, "utf8");
    if (content.includes("@storybook/addon-a11y")) {
      log(COLORS.GREEN, "✅ Storybook A11y addon configured");
    } else {
      log(COLORS.YELLOW, "⚠️  Storybook A11y addon not found");
    }
  }

  // Check for ARIA attributes in components
  const componentsDir = path.join(__dirname, "../packages/ui/src/components/ui");
  const files = fs.readdirSync(componentsDir).filter((f) => f.endsWith(".tsx"));

  let ariaCount = 0;
  for (const file of files) {
    const content = fs.readFileSync(path.join(componentsDir, file), "utf8");
    if (content.includes("aria-") || content.includes("role=")) {
      ariaCount++;
    }
  }

  const ariaPercentage = (ariaCount / files.length) * 100;
  if (ariaPercentage >= 70) {
    log(
      COLORS.GREEN,
      `✅ Good ARIA coverage: ${ariaCount}/${files.length} components (${ariaPercentage.toFixed(1)}%)`
    );
  } else {
    log(
      COLORS.YELLOW,
      `⚠️  Low ARIA coverage: ${ariaCount}/${files.length} components (${ariaPercentage.toFixed(1)}%)`
    );
  }

  return ariaPercentage >= 70;
}

function generateReport(bundleResults, vitalsCompliant, a11yCompliant) {
  log(COLORS.BOLD, "\n📋 SKEMYA COMPLIANCE REPORT");
  log(COLORS.BOLD, "=" * 50);

  const issues = [];

  // Bundle size compliance
  if (bundleResults.compliance) {
    log(COLORS.GREEN, "✅ Bundle Size: COMPLIANT");
  } else {
    log(COLORS.RED, "❌ Bundle Size: NON-COMPLIANT");
    issues.push("Bundle size exceeds 30KB limit");
  }

  // Web Vitals compliance
  if (vitalsCompliant) {
    log(COLORS.GREEN, "✅ Web Vitals: COMPLIANT");
  } else {
    log(COLORS.RED, "❌ Web Vitals: NON-COMPLIANT");
    issues.push("Web Vitals thresholds too high");
  }

  // Accessibility compliance
  if (a11yCompliant) {
    log(COLORS.GREEN, "✅ Accessibility: COMPLIANT");
  } else {
    log(COLORS.YELLOW, "⚠️  Accessibility: NEEDS IMPROVEMENT");
    issues.push("Accessibility coverage below recommended level");
  }

  const overallCompliant = bundleResults.compliance && vitalsCompliant && a11yCompliant;

  if (overallCompliant) {
    log(COLORS.GREEN, "\n🎉 OVERALL STATUS: SKEMYA COMPLIANT");
  } else {
    log(COLORS.RED, "\n🚨 OVERALL STATUS: NON-COMPLIANT");
    log(COLORS.YELLOW, "\nIssues to fix:");
    issues.forEach((issue) => log(COLORS.YELLOW, `  • ${issue}`));
  }

  // Recommendations
  log(COLORS.BLUE, "\n💡 RECOMMENDATIONS:");
  if (!bundleResults.compliance) {
    log(COLORS.BLUE, "  • Use dynamic imports to reduce bundle size");
    log(COLORS.BLUE, "  • Enable tree shaking and dead code elimination");
    log(COLORS.BLUE, "  • Consider code splitting for non-critical features");
  }

  if (!vitalsCompliant) {
    log(COLORS.BLUE, "  • Tighten Web Vitals thresholds to meet SKEMYA requirements");
    log(COLORS.BLUE, "  • Implement performance monitoring in production");
  }

  if (!a11yCompliant) {
    log(COLORS.BLUE, "  • Add ARIA labels and roles to more components");
    log(COLORS.BLUE, "  • Run accessibility audits with axe-core");
    log(COLORS.BLUE, "  • Test with screen readers");
  }

  log(COLORS.BLUE, "\n📊 METRICS SUMMARY:");
  if (bundleResults.runtime) {
    log(COLORS.BLUE, `  Runtime Bundle: ${bundleResults.runtime.sizeMB}KB`);
  }
  if (bundleResults.ui) {
    log(COLORS.BLUE, `  UI Bundle: ${bundleResults.ui.sizeMB}KB`);
  }
  log(COLORS.BLUE, `  LCP Target: <${SKEMYA_REQUIREMENTS.LCP_LIMIT}ms`);
  log(COLORS.BLUE, `  INP Target: <${SKEMYA_REQUIREMENTS.INP_LIMIT}ms`);

  return overallCompliant;
}

function main() {
  log(COLORS.BOLD, "🚀 SKEMYA Web Vitals Compliance Checker");
  log(COLORS.BLUE, "Checking performance requirements...\n");

  const bundleResults = checkBundleSize();
  const vitalsCompliant = checkWebVitalsThresholds();
  const a11yCompliant = checkAccessibilitySetup();

  const isCompliant = generateReport(bundleResults, vitalsCompliant, a11yCompliant);

  process.exit(isCompliant ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkBundleSize,
  checkWebVitalsThresholds,
  checkAccessibilitySetup,
  SKEMYA_REQUIREMENTS,
};
