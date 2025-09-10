module.exports = {
  displayName: "contracts",
  preset: "../../jest.preset.js",
  rootDir: ".",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testMatch: ["**/__tests__/**/*.{ts,tsx,js,jsx}", "**/*.{spec,test}.{ts,tsx,js,jsx}"],
};
