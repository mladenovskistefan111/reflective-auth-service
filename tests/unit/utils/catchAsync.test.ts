// tests/unit/utils/catchAsync.test.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../../src/utils/catchAsync'; // Adjust path as needed

describe('catchAsync', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn(); // Mock the next function to capture calls
  });

  it('should call next with an error if the async function rejects', async () => {
    const errorMessage = 'Something went wrong';
    const mockError = new Error(errorMessage);

    // An async function that always rejects
    const asyncFn = async (req: Request, res: Response, next: NextFunction) => {
      throw mockError;
    };

    // Wrap the async function with catchAsync
    const wrappedFn = catchAsync(asyncFn);

    // Call the wrapped function
    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    // Expect next to have been called with the error
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });

  it('should not call next if the async function resolves successfully', async () => {
    // An async function that resolves successfully
    const asyncFn = async (req: Request, res: Response, next: NextFunction) => {
      return 'success';
    };

    // Wrap the async function with catchAsync
    const wrappedFn = catchAsync(asyncFn);

    // Call the wrapped function
    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    // Expect next not to have been called
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return a function that is an Express RequestHandler', () => {
    const asyncFn = async (req: Request, res: Response, next: NextFunction) => {};
    const wrappedFn = catchAsync(asyncFn);

    // Verify it's a function (RequestHandler type)
    expect(typeof wrappedFn).toBe('function');
    // More robust type checking might involve casting or using a test helper
  });
});