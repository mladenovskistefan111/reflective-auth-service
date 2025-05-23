// tests/unit/middlewares/error.middleware.test.ts
import { Request, Response, NextFunction } from 'express';
import errorMiddleware from '../../../src/middlewares/error.middleware'; // Adjust path
import { ApiError } from '../../../src/utils/errors'; // Import custom error
import { logger } from '../../../src/utils/logger'; // Mock logger

// Mock the logger to prevent actual console output during tests
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('error.middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(), // Allows chaining .status().json()
      json: jest.fn(),
    };
    mockNext = jest.fn();
    // Clear logger mock calls before each test
    (logger.error as jest.Mock).mockClear();
  });

  it('should handle ApiError correctly', () => {
    const apiError = new ApiError(404, 'User not found', ['detail1', 'detail2']);
    
    errorMiddleware(apiError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(apiError);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'User not found',
      errors: ['detail1', 'detail2'],
    });
    expect(mockNext).not.toHaveBeenCalled(); // Middleware should terminate the request
  });

  it('should handle PrismaClientKnownRequestError correctly', () => {
    // Mimic a Prisma error object
    const prismaError = new Error('P2002 Unique constraint failed on the fields: (`email`)');
    prismaError.name = 'PrismaClientKnownRequestError';
    (prismaError as any).code = 'P2002'; // Add Prisma-specific code if needed for more detailed tests

    errorMiddleware(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(prismaError);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Database error occurred',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle Joi ValidationError correctly', () => {
    // Mimic a Joi validation error object
    const joiError = new Error('"email" must be a valid email');
    joiError.name = 'ValidationError';
    (joiError as any).details = [{ path: ['email'], message: '"email" must be a valid email' }]; // Joi errors have a 'details' array

    errorMiddleware(joiError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(joiError);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation error',
      errors: joiError.message, // Your error.middleware uses err.message directly here
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle generic errors in production environment', () => {
    process.env.NODE_ENV = 'production';
    const genericError = new Error('Internal server error details');
    
    errorMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(genericError);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error', // Generic message in production
    });
    expect(mockNext).not.toHaveBeenCalled();
    // Reset env var
    process.env.NODE_ENV = 'test';
  });

  it('should handle generic errors in development environment', () => {
    process.env.NODE_ENV = 'development'; // Or 'test'
    const genericError = new Error('Detailed internal server error message for dev');
    
    errorMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(genericError);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Detailed internal server error message for dev', // Detailed message in dev
    });
    expect(mockNext).not.toHaveBeenCalled();
    // Reset env var
    process.env.NODE_ENV = 'test';
  });
});
