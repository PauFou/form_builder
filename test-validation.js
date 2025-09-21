// Test file for validation
const testFunction = () => {
  console.log("This should trigger a warning in pre-commit hook");

  const config = {
    apiKey: "test-key",
    endpoint: "/api/test",
  };

  return config;
};

export default testFunction;
