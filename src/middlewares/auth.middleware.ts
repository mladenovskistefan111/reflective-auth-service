import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';
import { ApiError } from '../utils/errors';


/**
 * Middleware to verify JWT token and attach user to request
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authorization token required');
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = verifyJwt(token);
    
    // Attach user to request
    req.user = decoded;
    
    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

/**
 * Middleware to check user roles
 */
export const authorize = (roles: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized');
    }

    if (roles.length && !roles.includes(req.user.role)) {
      throw new ApiError(403, 'Insufficient permissions');
    }

    next();
  };
};