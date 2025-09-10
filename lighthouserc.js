module.exports = {
  ci: {
    collect: {
      staticDistDir: "./apps/builder/out",
      url: ["http://localhost:3000/", "http://localhost:3000/forms"],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        // Performance
        "first-contentful-paint": ["error", { maxNumericValue: 1500 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        interactive: ["error", { maxNumericValue: 3800 }],
        "speed-index": ["error", { maxNumericValue: 3400 }],
        "total-blocking-time": ["error", { maxNumericValue: 300 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],

        // Accessibility (WCAG AA)
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "color-contrast": "error",
        "image-alt": "error",
        label: "error",
        tabindex: "error",
        "meta-viewport": "error",

        // Best practices
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "errors-in-console": "warn",
        "no-document-write": "error",
        "js-libraries": "warn",

        // SEO
        "categories:seo": ["warn", { minScore: 0.9 }],
        "meta-description": "warn",
        "document-title": "error",

        // PWA
        "categories:pwa": ["warn", { minScore: 0.5 }],
        "works-offline": "off",
        "installable-manifest": "off",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
