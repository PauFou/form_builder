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
    // Allow unused vars in UI component library (especially Storybook)
    "@typescript-eslint/no-unused-vars": "off",
    // Disable other problematic rules for component library
    "react/display-name": "off",
    "react/prop-types": "off",
    "no-undef": "off",
    // Allow React hooks issues in component library/Storybook
    "react-hooks/rules-of-hooks": "off",
    "react-hooks/exhaustive-deps": "off",
    // Allow TypeScript namespace in component library
    "@typescript-eslint/no-namespace": "off",
    // Allow require in config files
    "@typescript-eslint/no-var-requires": "off",
    // Allow regex escapes in validation utilities
    "no-useless-escape": "off",
  },
};
