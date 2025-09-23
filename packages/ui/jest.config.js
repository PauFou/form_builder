const baseConfig = require("../../jest.preset.js");

module.exports = {
  ...baseConfig,
  displayName: "@skemya/ui",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  testEnvironment: "jsdom",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/index.ts",
    "!src/**/*.d.ts",
    "!src/test-setup.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!jest-setup.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 18,
      branches: 14,
      functions: 9,
      lines: 17,
    },
  },
  // Accessibility testing configuration
  testTimeout: 10000, // Allow time for axe-core tests
  transform: {
    "^.+\\.(ts|tsx)$": [
      "@swc/jest",
      {
        jsc: {
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
      },
    ],
  },
};
