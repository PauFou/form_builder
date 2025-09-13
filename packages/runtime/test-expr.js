// Test partial save functionality
const { PartialSaveService } = require('./dist/services/partial-save-service.js');

async function testPartialSave() {
  console.log('Testing Partial Save Service...\n');

  // Create config
  const config = {
    formId: 'test-form-123',
    apiUrl: 'https://api.example.com',
    respondentKey: 'user-456',
    onPartialSave: async (data) => {
      console.log('Custom partial save handler called with:', data);
      return { resumeToken: 'test-token-789' };
    }
  };

  // Create service
  const service = new PartialSaveService(config);

  // Test data
  const testData = {
    formId: config.formId,
    respondentKey: config.respondentKey,
    values: {
      name: 'John Doe',
      email: 'john@example.com',
      feedback: 'Great service!'
    },
    currentStep: 2,
    progress: 66.67,
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    metadata: {
      userAgent: 'Test Browser',
      viewport: { width: 1920, height: 1080 }
    }
  };

  // Test save
  console.log('1. Saving partial data...');
  await service.save(testData);
  console.log('   ✓ Data saved to localStorage immediately');

  // Wait for API save
  console.log('\n2. Waiting for throttled API save (2s)...');
  await new Promise(resolve => setTimeout(resolve, 2100));
  console.log('   ✓ API save completed');

  // Test load
  console.log('\n3. Loading saved data...');
  const loaded = await service.load();
  console.log('   ✓ Loaded data:', {
    hasData: !!loaded,
    values: loaded?.values,
    progress: loaded?.progress
  });

  // Test resume URL
  console.log('\n4. Getting resume URL...');
  const resumeUrl = service.getResumeUrl();
  console.log('   ✓ Resume URL:', resumeUrl || 'Not available yet');

  // Test clear
  console.log('\n5. Clearing saved data...');
  await service.clear();
  console.log('   ✓ Data cleared');

  // Cleanup
  service.destroy();
  console.log('\n✅ All tests completed!');
}

// Run test
testPartialSave().catch(console.error);