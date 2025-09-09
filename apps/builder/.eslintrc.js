module.exports = {
  extends: ['@forms/config/eslint-preset'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};