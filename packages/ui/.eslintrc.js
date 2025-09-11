module.exports = {
  root: true,
  extends: ["../config/eslint-preset.js"],
  rules: {
    // Allow any in UI component libraries
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
