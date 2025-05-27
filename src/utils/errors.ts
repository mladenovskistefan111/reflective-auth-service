export class ApiError extends Error {
    statusCode: number;
    errors?: any[];
  
    constructor(statusCode: number, message: string, errors?: any[]) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      Object.setPrototypeOf(this, ApiError.prototype);
    }
  }
  
  export class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
      super(404, message);
      Object.setPrototypeOf(this, NotFoundError.prototype);
    }
  }
  
  export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
      super(401, message);
      Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }
  }
  
  export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
      super(403, message);
      Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
  }
  
  export class ValidationError extends ApiError {
    constructor(message = 'Validation error', errors?: any[]) {
      super(400, message, errors);
      Object.setPrototypeOf(this, ValidationError.prototype);
    }
  }