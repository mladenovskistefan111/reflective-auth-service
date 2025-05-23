import { Request, Response, NextFunction, RequestHandler } from 'express';

// Define a type for your async controller functions
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

/**
 * Higher-order function to wrap async route handlers and catch errors.
 * This prevents the need for try/catch blocks in every async controller method.
 */
export const catchAsync = (fn: AsyncHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
