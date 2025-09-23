const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  displayName: "builder",
  rootDir: ".",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "jest-transform-stub",
  },
  testEnvironment: "jest-environment-jsdom",
  testMatch: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.{spec,test}.{js,jsx,ts,tsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/e2e/"],
  // Handle ES modules
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transformIgnorePatterns: ["node_modules/(?!(uuid|@skemya/|geist|react-hotkeys-hook)/)"],
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!next.config.mjs",
    "!jest.config.js",
    "!tailwind.config.ts",
    "!postcss.config.mjs",
  ],
};

module.exports = createJestConfig(customJestConfig);
