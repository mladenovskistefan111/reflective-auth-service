import { Request, Response, NextFunction } from 'express';
import errorMiddleware from '../../../src/middlewares/error.middleware';
import { ApiError } from '../../../src/utils/errors'; 
import { logger } from '../../../src/utils/logger'; 

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
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
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
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle PrismaClientKnownRequestError correctly', () => {
    const prismaError = new Error('P2002 Unique constraint failed on the fields: (`email`)');
    prismaError.name = 'PrismaClientKnownRequestError';
    (prismaError as any).code = 'P2002';

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
    const joiError = new Error('"email" must be a valid email');
    joiError.name = 'ValidationError';
    (joiError as any).details = [{ path: ['email'], message: '"email" must be a valid email' }];

    errorMiddleware(joiError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(joiError);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Validation error',
      errors: joiError.message,
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
      message: 'Internal server error',
    });
    expect(mockNext).not.toHaveBeenCalled();
    process.env.NODE_ENV = 'test';
  });

  it('should handle generic errors in development environment', () => {
    process.env.NODE_ENV = 'development'; 
    const genericError = new Error('Detailed internal server error message for dev');
    
    errorMiddleware(genericError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(genericError);
    expect(mockResponse.status).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledTimes(1);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Detailed internal server error message for dev',
    });
    expect(mockNext).not.toHaveBeenCalled();
    process.env.NODE_ENV = 'test';
  });
});
