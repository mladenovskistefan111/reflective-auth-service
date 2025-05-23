import jwt from 'jsonwebtoken';
import { ApiError } from './errors';

interface JwtPayload {
  id: number;
  email: string;
  role: string;
  [key: string]: any;
}

/**
 * Generate JWT token
 */
export const generateJwt = (payload: JwtPayload, expiresIn: string | number = '1h'): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  // Explicitly define options and cast expiresIn to help TypeScript with overloads
  // jwt.SignOptions['expiresIn'] ensures the type is compatible with what jsonwebtoken expects.
  const signOptions: jwt.SignOptions = { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, secret as string, signOptions);
};

/**
 * Verify JWT token
 */
export const verifyJwt = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  try {
    // Assert 'secret' as string for 'jwt.verify' overload
    const decoded = jwt.verify(token, secret as string) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'Token expired');
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(401, 'Invalid token');
    }
    
    throw error;
  }
};
