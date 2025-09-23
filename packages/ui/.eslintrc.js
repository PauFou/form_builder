module.exports = {
  root: true,
  extends: ["../config/eslint-preset.js"],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  rules: {
    // Allow any in UI component libraries
    "@typescript-eslint/no-explicit-any": "warn",
    // Allow unescaped entities in Storybook stories
    "react/no-unescaped-entities": "off",
  },
};
