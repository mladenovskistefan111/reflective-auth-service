import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

const errorMiddleware: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => { // Explicitly declare return type as void
  logger.error(err);

  // If it's our custom ApiError, use its status code and message
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ // Removed return
      success: false,
      message: err.message,
      errors: err.errors
    });
    return; // Explicitly return void
  }

  // If it's a Prisma error, handle it specially
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({ // Removed return
      success: false,
      message: 'Database error occurred',
    });
    return; // Explicitly return void
  }

  // Handle validation errors from Joi
  if (err.name === 'ValidationError') {
    res.status(400).json({ // Removed return
      success: false,
      message: 'Validation error',
      errors: err.message
    });
    return; // Explicitly return void
  }

  // Default error handling
  res.status(500).json({ // Removed return
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
  return; // Explicitly return void
};

export default errorMiddleware;