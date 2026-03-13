import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
  // Setup global test environment
  console.log('🧪 Test environment initialized');
});

afterAll(() => {
  // Cleanup after all tests
  console.log('🧪 Test environment cleaned up');
});

// Mock environment variables for tests
process.env.VITE_API_URL = process.env.VITE_API_URL || 'http://localhost:5222';