import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Server configuration
  port: process.env.PORT || 3001,
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
  },
  
  // Email verification
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  
  // Database URL is accessed directly through process.env in database.ts
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;