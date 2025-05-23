/**
 * Custom API Error class for consistent error handling
 */
export class ApiError extends Error {
    statusCode: number;
    errors?: any[];
  
    constructor(statusCode: number, message: string, errors?: any[]) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      
      // This is needed since we're extending a built-in class
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  }
  
  /**
   * Not Found Error (404)
   */
  export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
      super(404, message);
      Object.setPrototypeOf(this, NotFoundError.prototype);
    }
  }
  
  /**
   * Unauthorized Error (401)
   */
  export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
      super(401, message);
      Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
  }
  
  /**
   * Forbidden Error (403)
   */
  export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
      super(403, message);
      Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
  }
  
  /**
   * Validation Error (400)
   */
  export class ValidationError extends ApiError {
    constructor(message = 'Validation error', errors?: any[]) {
      super(400, message, errors);
      Object.setPrototypeOf(this, ValidationError.prototype);
    }
  }