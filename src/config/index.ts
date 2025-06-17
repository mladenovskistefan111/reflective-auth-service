import dotenv from 'dotenv';

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 3001,  // Will still allow 0 as a valid port
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY ?? '15m',  // Will use '15m' if the value is null/undefined
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY ?? '7d',  // Will use '7d' if the value is null/undefined
  },
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  logLevel: process.env.LOG_LEVEL ?? 'info',  // Will use 'info' if null/undefined
};

export default config;
