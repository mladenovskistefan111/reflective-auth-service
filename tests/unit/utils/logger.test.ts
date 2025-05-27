import pino from 'pino';

const mockPinoConstructor = jest.fn((options) => {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      fatal: jest.fn(),
    })),
  };
});

jest.mock('pino', () => mockPinoConstructor);

describe('logger', () => {
  beforeEach(() => {
    mockPinoConstructor.mockClear();
    process.env.NODE_ENV = 'test';
    jest.resetModules();
  });

  it('should be configured with pino-pretty transport', () => {
    const { logger } = require('../../../src/utils/logger');

    expect(mockPinoConstructor).toHaveBeenCalledTimes(1);
    const config = mockPinoConstructor.mock.calls[0][0];

    expect(config).toHaveProperty('transport');
    expect(config.transport!).toHaveProperty('target', 'pino-pretty');
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
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const { logger } = require('../../../src/utils/logger');

    const config = mockPinoConstructor.mock.calls[0][0];
    expect(config.level).toBe('debug');
  });

  it('should set level to "info" in production environment', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const { logger } = require('../../../src/utils/logger');

    const config = mockPinoConstructor.mock.calls[0][0];
    expect(config.level).toBe('info');
  });
});
