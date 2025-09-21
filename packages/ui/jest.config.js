const baseConfig = require("../../jest.preset.js");

module.exports = {
  ...baseConfig,
  displayName: "@skemya/ui",
  testMatch: ["<rootDir>/src/**/__tests__/**/*.{test,spec}.{ts,tsx}"],
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  testEnvironment: "jsdom",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/index.ts",
    "!src/**/*.d.ts",
    "!src/components/ui/**", // Skip UI components for now
    "!src/test-setup.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
