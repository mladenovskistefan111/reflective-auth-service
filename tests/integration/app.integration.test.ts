// tests/integration/app.integration.test.ts
import request from 'supertest'; // Import supertest for making HTTP requests
import app from '../../src/app'; // Import your Express app
import { logger } from '../../src/utils/logger'; // Import logger to mock it

// Mock the logger to prevent console output during tests
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('app.ts integration tests', () => {
  // Before all tests, ensure the logger is mocked to avoid actual console output
  beforeAll(() => {
    // This is already handled by the jest.mock at the top,
    // but explicit clearing here ensures a clean state for all tests.
    (logger.info as jest.Mock).mockClear();
    (logger.error as jest.Mock).mockClear();
  });

  // After all tests, restore original environment if necessary (though jest.mock handles most of it)
  afterAll(() => {
    // No specific cleanup needed for app.ts itself here,
    // but for tests involving the database, this is where you'd close connections.
  });

  it('should return 200 OK for the /health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual({ status: 'ok', service: 'auth-service' });
  });

  it('should return 404 Not Found for an unhandled route', async () => {
    const res = await request(app).get('/non-existent-route');
    expect(res.statusCode).toEqual(404);
    // Assuming your error middleware sends a generic 404 message for unhandled routes
    // You might need to adjust this expectation based on your actual error handling for 404s.
    // By default, Express sends "Cannot GET /non-existent-route" as plain text.
    // If your error middleware catches all errors, it might format it.
    // For now, let's check for a common Express 404 response.
    expect(res.text).toContain('Cannot GET /non-existent-route'); 
  });

  // You can add more integration tests here for global middleware or error handling scenarios
  // For example, if you had a global rate limiting middleware, you could test it here.
});
