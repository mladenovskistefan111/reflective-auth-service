import { ApiError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError } from '../../../src/utils/errors';

describe('Error classes', () => {
  describe('ApiError', () => {
    it('should create instance with correct properties', () => {
      const message = 'Test API error';
      const statusCode = 418;
      const errors = [{ field: 'test', message: 'Test error' }];
      
      const error = new ApiError(statusCode, message, errors);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.errors).toEqual(errors);
      expect(error.name).toBe('Error');
    });
    
    it('should work without errors array', () => {
      const message = 'Test API error';
      const statusCode = 500;
      
      const error = new ApiError(statusCode, message);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(statusCode);
      expect(error.errors).toBeUndefined();
    });

    it('should properly capture stack trace', () => {
      const error = new ApiError(500, 'Server error');
      expect(error.stack).toBeDefined();
    });
  });
  
  describe('NotFoundError', () => {
    it('should create instance with correct properties and default message', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });
    
    it('should create instance with custom message', () => {
      const message = 'User not found';
      const error = new NotFoundError(message);
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(404);
    });

    it('should maintain instanceof behavior', () => {
      const error = new NotFoundError();
      function checkErrorType(err: any) {
        return err instanceof NotFoundError;
      }
      expect(checkErrorType(error)).toBe(true);
    });
  });
  
  describe('UnauthorizedError', () => {
    it('should create instance with correct properties and default message', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
    });
    
    it('should create instance with custom message', () => {
      const message = 'Invalid credentials';
      const error = new UnauthorizedError(message);
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(401);
    });

    it('should maintain instanceof behavior', () => {
      const error = new UnauthorizedError();
      function checkErrorType(err: any) {
        return err instanceof UnauthorizedError;
      }
      expect(checkErrorType(error)).toBe(true);
    });
  });
  
  describe('ForbiddenError', () => {
    it('should create instance with correct properties and default message', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Forbidden');
      expect(error.statusCode).toBe(403);
    });
    
    it('should create instance with custom message', () => {
      const message = 'Not enough permissions';
      const error = new ForbiddenError(message);
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(403);
    });

    it('should maintain instanceof behavior', () => {
      const error = new ForbiddenError();
      function checkErrorType(err: any) {
        return err instanceof ForbiddenError;
      }
      expect(checkErrorType(error)).toBe(true);
    });
  });
  
  describe('ValidationError', () => {
    it('should create instance with correct properties and default message', () => {
      const error = new ValidationError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Validation error');
      expect(error.statusCode).toBe(400);
      expect(error.errors).toBeUndefined();
    });
    
    it('should create instance with custom message and errors', () => {
      const message = 'Form validation failed';
      const errors = [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password must be at least 8 characters' }
      ];
      
      const error = new ValidationError(message, errors);
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe(message);
      expect(error.statusCode).toBe(400);
      expect(error.errors).toEqual(errors);
    });

    it('should maintain instanceof behavior', () => {
      const error = new ValidationError();
      function checkErrorType(err: any) {
        return err instanceof ValidationError;
      }
      expect(checkErrorType(error)).toBe(true);
    });
  });
  
  describe('Error inheritance chain', () => {
    it('should maintain proper instanceof relationships', () => {
      const apiError = new ApiError(500, 'General error');
      const notFoundError = new NotFoundError();
      const unauthorizedError = new UnauthorizedError();
      const forbiddenError = new ForbiddenError();
      const validationError = new ValidationError();

      expect(apiError).toBeInstanceOf(Error);
      expect(notFoundError).toBeInstanceOf(Error);
      expect(unauthorizedError).toBeInstanceOf(Error);
      expect(forbiddenError).toBeInstanceOf(Error);
      expect(validationError).toBeInstanceOf(Error);
     
      expect(apiError).toBeInstanceOf(ApiError);
      expect(notFoundError).toBeInstanceOf(ApiError);
      expect(unauthorizedError).toBeInstanceOf(ApiError);
      expect(forbiddenError).toBeInstanceOf(ApiError);
      expect(validationError).toBeInstanceOf(ApiError);

      expect(notFoundError).toBeInstanceOf(NotFoundError);
      expect(unauthorizedError).toBeInstanceOf(UnauthorizedError);
      expect(forbiddenError).toBeInstanceOf(ForbiddenError);
      expect(validationError).toBeInstanceOf(ValidationError);

      expect(notFoundError).not.toBeInstanceOf(UnauthorizedError);
      expect(unauthorizedError).not.toBeInstanceOf(NotFoundError);
      expect(forbiddenError).not.toBeInstanceOf(ValidationError);
      expect(validationError).not.toBeInstanceOf(ForbiddenError);
    });
  });
});