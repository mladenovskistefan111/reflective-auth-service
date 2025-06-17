import { jest } from '@jest/globals';

interface PinoOptions {
  transport?: {
    target: string;
    options?: {
      colorize?: boolean;
      translateTime?: string;
      ignore?: string;
    };
  };
  level?: string;
}

const mockPinoConstructor = jest.fn((options: PinoOptions) => {
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

jest.mock('pino', () => ({
  pino: mockPinoConstructor,
  default: mockPinoConstructor
}));

describe('logger', () => {
  beforeEach(() => {
    mockPinoConstructor.mockClear();
    process.env.NODE_ENV = 'test';
    jest.resetModules();
  });

  it('should be configured with pino-pretty transport', async () => {
    await import('../../../src/utils/logger.js');

    expect(mockPinoConstructor).toHaveBeenCalledTimes(1);
    const config = mockPinoConstructor.mock.calls[0][0] as PinoOptions;

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

  it('should set level to "debug" in development/test environment', async () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    await import('../../../src/utils/logger.js');

    const config = mockPinoConstructor.mock.calls[0][0] as PinoOptions;
    expect(config.level).toBe('debug');
  });

  it('should set level to "info" in production environment', async () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    await import('../../../src/utils/logger.js');

    const config = mockPinoConstructor.mock.calls[0][0] as PinoOptions;
    expect(config.level).toBe('info');
  });
});
