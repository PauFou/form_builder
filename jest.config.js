module.exports = {
  projects: ["<rootDir>/apps/*/jest.config.js", "<rootDir>/packages/*/jest.config.js"],
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/dist/**",
    "!**/coverage/**",
    "!**/jest.config.js",
    "!**/next.config.{js,mjs}",
    "!**/tailwind.config.{js,ts}",
    "!**/postcss.config.{js,mjs}",
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10,
    },
  },
};
