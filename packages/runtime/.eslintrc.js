module.exports = {
  root: true,
  extends: ["../config/eslint-preset.js"],
  rules: {
    // Allow any in test files and type definitions
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
