import { User } from '@prisma/client';
import { generateJwt, verifyJwt } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { instrumentedPrisma } from '../config/database.js';
import { recordAuthAttempt } from '../observability.js';

interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

const authService = {
  async register(userData: RegisterData): Promise<User> {
    try {
      const existingUser = await instrumentedPrisma.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            userData.username ? { username: userData.username } : {}
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          recordAuthAttempt('register', false);
          throw new ApiError(409, 'Email already in use');
        }
        if (userData.username && existingUser.username === userData.username) {
          recordAuthAttempt('register', false);
          throw new ApiError(409, 'Username already in use');
        }
      }

      const hashedPassword = await hashPassword(userData.password);
      const verifyToken = uuidv4();

      const user = await instrumentedPrisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          verifyToken
        }
      });

      // Record successful registration
      recordAuthAttempt('register', true, user.id.toString());
      
      logger.info(`Verification token for ${userData.email}: ${verifyToken}`);
      
      return user;
    } catch (error) {
      // Record failed registration if not already recorded
      if (!(error instanceof ApiError)) {
        recordAuthAttempt('register', false);
      }
      throw error;
    }
  },

  async login(email: string, password: string) {
    try {
      const user = await instrumentedPrisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        recordAuthAttempt('login', false);
        throw new ApiError(401, 'Invalid credentials');
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        recordAuthAttempt('login', false, user.id.toString());
        throw new ApiError(401, 'Invalid credentials');
      }

      if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        recordAuthAttempt('login', false, user.id.toString());
        throw new ApiError(403, 'Please verify your email before logging in');
      }

      const accessToken = generateJwt({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      }, '15m'); 
      
      const refreshToken = uuidv4();
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
      
      await instrumentedPrisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expires: refreshExpiresAt
        }
      });
      
      await instrumentedPrisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Record successful login
      recordAuthAttempt('login', true, user.id.toString());

      return {
        accessToken,
        refreshToken,
        user
      };
    } catch (error) {
      // Record failed login if not already recorded
      if (!(error instanceof ApiError)) {
        recordAuthAttempt('login', false);
      }
      throw error;
    }
  },

  async getUserById(id: number): Promise<User | null> {
    return instrumentedPrisma.user.findUnique({
      where: { id }
    });
  },

  async refreshToken(token: string) {
    try {
      const refreshTokenRecord = await instrumentedPrisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!refreshTokenRecord) {
        recordAuthAttempt('refresh_token', false);
        throw new ApiError(401, 'Invalid refresh token');
      }

      if (new Date() > refreshTokenRecord.expires) {
        await instrumentedPrisma.refreshToken.delete({
          where: { id: refreshTokenRecord.id }
        });
        recordAuthAttempt('refresh_token', false, refreshTokenRecord.user.id.toString());
        throw new ApiError(401, 'Refresh token expired');
      }

      const accessToken = generateJwt({ 
        id: refreshTokenRecord.user.id, 
        email: refreshTokenRecord.user.email,
        role: refreshTokenRecord.user.role 
      }, '15m');
      
      const newRefreshToken = uuidv4();
      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); 

      await instrumentedPrisma.refreshToken.update({
        where: { id: refreshTokenRecord.id },
        data: {
          token: newRefreshToken,
          expires: refreshExpiresAt
        }
      });

      // Record successful token refresh
      recordAuthAttempt('refresh_token', true, refreshTokenRecord.user.id.toString());

      return {
        accessToken,
        newRefreshToken
      };
    } catch (error) {
      // Record failed token refresh if not already recorded
      if (!(error instanceof ApiError)) {
        recordAuthAttempt('refresh_token', false);
      }
      throw error;
    }
  },

  async logout(token: string): Promise<void> {
    await instrumentedPrisma.refreshToken.deleteMany({
      where: { token }
    });
    // Note: We could add user tracking here if we had user context
    recordAuthAttempt('logout', true);
  },

  async verifyEmail(token: string): Promise<void> {
    const user = await instrumentedPrisma.user.findFirst({
      where: { verifyToken: token }
    });

    if (!user) {
      recordAuthAttempt('email_verification', false);
      throw new ApiError(400, 'Invalid verification token');
    }

    await instrumentedPrisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null
      }
    });

    recordAuthAttempt('email_verification', true, user.id.toString());
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await instrumentedPrisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't record failed attempt here to prevent email enumeration
      return;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await instrumentedPrisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires
      }
    });

    recordAuthAttempt('password_reset_request', true, user.id.toString());
    logger.info(`Password reset token for ${email}: ${resetToken}`);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await instrumentedPrisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date() 
        }
      }
    });

    if (!user) {
      recordAuthAttempt('password_reset', false);
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await instrumentedPrisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null
      }
    });

    recordAuthAttempt('password_reset', true, user.id.toString());
  }
};

export default authService;