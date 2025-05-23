// tests/unit/utils/logger.test.ts
import pino from 'pino';
// We don't directly import 'logger' here at the top level
// because we want to control its import after mocking and environment setup.

// Create a mock function for the pino constructor/factory.
// This mock will be the actual function that 'pino' resolves to.
const mockPinoConstructor = jest.fn((options) => {
  // When the logger module calls pino(), this function will be executed.
  // We can optionally return a mock instance of a logger here,
  // or even call the original pino if needed for specific scenarios.
  // For configuration tests, a simple mock instance is sufficient.
  return {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(() => ({ // Mock child logger for completeness if used
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      fatal: jest.fn(),
    })),
  };
});

// Mock the 'pino' module globally to return our specific mock constructor.
// This ensures that any import of 'pino' within the tests (after resetModules)
// will receive `mockPinoConstructor`.
jest.mock('pino', () => mockPinoConstructor);

describe('logger', () => {
  beforeEach(() => {
    // Clear all mock calls on our `mockPinoConstructor` before each test.
    mockPinoConstructor.mockClear(); 
    // Reset environment variable to 'test' for consistent testing across different scenarios.
    process.env.NODE_ENV = 'test';
    // Reset the module cache. This is crucial for re-importing `src/utils/logger`
    // and ensuring it picks up the latest `process.env.NODE_ENV` and the mock.
    jest.resetModules();
  });

  it('should be configured with pino-pretty transport', () => {
    // Re-import the logger module *inside* the test.
    // This ensures that `src/utils/logger` is re-evaluated and calls the mocked `pino`.
    const { logger } = require('../../../src/utils/logger');

    // Now, assert on `mockPinoConstructor` which is the actual mock capturing the call.
    expect(mockPinoConstructor).toHaveBeenCalledTimes(1);
    // Get the configuration object passed to the pino constructor.
    const config = mockPinoConstructor.mock.calls[0][0];

    // Assert that the 'transport' property exists on the config.
    expect(config).toHaveProperty('transport');
    // Use a non-null assertion (!) here to tell TypeScript that `config.transport`
    // will definitely be defined after the `toHaveProperty` check.
    expect(config.transport!).toHaveProperty('target', 'pino-pretty');
    // Assert the options of the transport.
    expect(config.transport!).toHaveProperty('options');
    expect(config.transport!.options).toEqual(
      expect.objectContaining({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      })
    );
  });

  it('should set level to "debug" in development/test environment', () => {
    // Set NODE_ENV to 'development' for this test.
    process.env.NODE_ENV = 'development';
    // Reset modules and re-import logger to apply the new environment variable.
    jest.resetModules();
    const { logger } = require('../../../src/utils/logger'); 

    // Get the configuration and assert the log level.
    const config = mockPinoConstructor.mock.calls[0][0];
    expect(config.level).toBe('debug');
  });

  it('should set level to "info" in production environment', () => {
    // Set NODE_ENV to 'production' for this test.
    process.env.NODE_ENV = 'production';
    // Reset modules and re-import logger to apply the new environment variable.
    jest.resetModules();
    const { logger } = require('../../../src/utils/logger'); 

    // Get the configuration and assert the log level.
    const config = mockPinoConstructor.mock.calls[0][0];
    expect(config.level).toBe('info');
  });

  // This test is conceptual and demonstrates how you *would* test if a log message is emitted.
  // For actual implementation, you'd typically mock the logger instance's methods directly
  // or configure pino with a test-specific stream to capture output.
  it('should be able to log a message (conceptual)', () => {
    // Example:
    // jest.resetModules(); // Ensure fresh logger instance
    // const { logger } = require('../../../src/utils/logger');
    // // The mockPinoConstructor returns a mock instance with info/debug/error methods
    // // We can access these through the logger instance
    // logger.info('Test message');
    // expect(mockPinoConstructor.mock.results[0].value.info).toHaveBeenCalledWith('Test message');
  });
});
