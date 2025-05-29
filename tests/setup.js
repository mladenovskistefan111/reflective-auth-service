// tests/setup.ts
import { config } from 'dotenv';
// Load environment variables for tests
config({ path: '.env.test' });
// Set default environment variables for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
// Mock console.log in tests to reduce noise
const originalConsole = global.console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: originalConsole.error, // Keep error for debugging
};
// Clean up after tests
afterEach(() => {
    jest.clearAllMocks();
});
//# sourceMappingURL=setup.js.map