import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../../../src/utils/catchAsync'; 

describe('catchAsync', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn(); 
  });

  it('should call next with an error if the async function rejects', async () => {
    const errorMessage = 'Something went wrong';
    const mockError = new Error(errorMessage);

    const asyncFn = async (req: Request, res: Response, next: NextFunction) => {
      throw mockError;
    };

    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledWith(mockError);
  });

  it('should not call next if the async function resolves successfully', async () => {
    const asyncFn = async (req: Request, res: Response, next: NextFunction) => {
      return 'success';
    };

    const wrappedFn = catchAsync(asyncFn);

    await wrappedFn(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return a function that is an Express RequestHandler', () => {
    const asyncFn = async (req: Request, res: Response, next: NextFunction) => {};
    const wrappedFn = catchAsync(asyncFn);

    expect(typeof wrappedFn).toBe('function');
  });
});