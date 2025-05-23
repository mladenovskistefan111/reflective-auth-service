// tests/unit/middlewares/auth.middleware.test.ts
import { Request, Response, NextFunction } from 'express';
import { authMiddleware, authorize } from '../../../src/middlewares/auth.middleware'; // Adjust path
import { verifyJwt } from '../../../src/utils/jwt'; // Mock this
import { ApiError } from '../../../src/utils/errors'; // Import for error instance checking

// Mock the jwt utility functions
jest.mock('../../../src/utils/jwt', () => ({
  verifyJwt: jest.fn(),
  // Add other jwt functions if they are exported and used in middleware
}));

describe('auth.middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(), // Allow chaining .status().json()
      json: jest.fn(),
    };
    mockNext = jest.fn();
    // Clear mocks for verifyJwt before each test
    (verifyJwt as jest.Mock).mockClear();
  });

  describe('authMiddleware', () => {
    it('should call next() and attach user if a valid token is provided', () => {
      const mockToken = 'Bearer validtoken';
      const decodedUser = { id: 1, email: 'test@example.com', role: 'USER' };
      
      // Mock verifyJwt to return a decoded user
      (verifyJwt as jest.Mock).mockReturnValue(decodedUser);

      mockRequest.headers = { authorization: mockToken };

      authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Expect verifyJwt to have been called with the token part
      expect(verifyJwt).toHaveBeenCalledTimes(1);
      expect(verifyJwt).toHaveBeenCalledWith('validtoken');
      // Expect user to be attached to the request
      expect(mockRequest.user).toEqual(decodedUser);
      // Expect next to be called without an error
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw ApiError if authorization header is missing', () => {
      mockRequest.headers = {}; // No authorization header

      expect(() => authMiddleware(mockRequest as Request, mockResponse as Response, mockNext))
        .toThrow(new ApiError(401, 'Authorization token required'));
      
      expect(verifyJwt).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ApiError if authorization header does not start with "Bearer "', () => {
      mockRequest.headers = { authorization: 'Token invalid' };

      expect(() => authMiddleware(mockRequest as Request, mockResponse as Response, mockNext))
        .toThrow(new ApiError(401, 'Authorization token required'));
      
      expect(verifyJwt).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ApiError if token is invalid or expired', () => {
      const mockToken = 'Bearer invalidtoken';
      // Mock verifyJwt to throw an error
      (verifyJwt as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      mockRequest.headers = { authorization: mockToken };

      expect(() => authMiddleware(mockRequest as Request, mockResponse as Response, mockNext))
        .toThrow(new ApiError(401, 'Invalid or expired token'));
      
      expect(verifyJwt).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should call next() if user has the required role', () => {
      const requiredRoles = ['ADMIN'];
      mockRequest.user = { id: 1, email: 'admin@example.com', role: 'ADMIN' };

      const authorizeMiddleware = authorize(requiredRoles);
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() if no roles are required', () => {
      mockRequest.user = { id: 1, email: 'user@example.com', role: 'USER' };

      const authorizeMiddleware = authorize(); // No roles specified
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw ApiError if user is not attached to request', () => {
      const requiredRoles = ['ADMIN'];
      mockRequest.user = undefined; // No user attached

      const authorizeMiddleware = authorize(requiredRoles);
      expect(() => authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext))
        .toThrow(new ApiError(401, 'Unauthorized'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ApiError if user does not have the required role', () => {
      const requiredRoles = ['ADMIN'];
      mockRequest.user = { id: 1, email: 'user@example.com', role: 'USER' }; // User has 'USER' role

      const authorizeMiddleware = authorize(requiredRoles);
      expect(() => authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext))
        .toThrow(new ApiError(403, 'Insufficient permissions'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ApiError if user has multiple roles but none match the required', () => {
      const requiredRoles = ['SUPER_ADMIN'];
      mockRequest.user = { id: 1, email: 'user@example.com', role: 'USER' }; 

      const authorizeMiddleware = authorize(requiredRoles);
      expect(() => authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext))
        .toThrow(new ApiError(403, 'Insufficient permissions'));

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
