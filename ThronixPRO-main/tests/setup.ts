// Jest setup file for testing environment
import { beforeAll, afterAll, beforeEach } from '@jest/globals';

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!';
});

beforeEach(() => {
  // Clear any mocks between tests
  jest.clearAllMocks();
});

afterAll(() => {
  // Cleanup
});