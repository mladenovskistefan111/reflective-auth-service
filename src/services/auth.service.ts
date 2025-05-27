import { PrismaClient, User } from '@prisma/client';
import { generateJwt, verifyJwt } from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface RegisterData {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

const authService = {
  async register(userData: RegisterData): Promise<User> {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          userData.username ? { username: userData.username } : {}
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new ApiError(409, 'Email already in use');
      }
      if (userData.username && existingUser.username === userData.username) {
        throw new ApiError(409, 'Username already in use');
      }
    }

    const hashedPassword = await hashPassword(userData.password);
    const verifyToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        verifyToken
      }
    });

    logger.info(`Verification token for ${userData.email}: ${verifyToken}`);
    
    return user;
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
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
    
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expires: refreshExpiresAt
      }
    });
    
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      accessToken,
      refreshToken,
      user
    };
  },

  async getUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  },

  async refreshToken(token: string) {
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!refreshTokenRecord) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    if (new Date() > refreshTokenRecord.expires) {
      await prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id }
      });
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

    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: {
        token: newRefreshToken,
        expires: refreshExpiresAt
      }
    });

    return {
      accessToken,
      newRefreshToken
    };
  },

  async logout(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token }
    });
  },

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { verifyToken: token }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null
      }
    });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires
      }
    });

    logger.info(`Password reset token for ${email}: ${resetToken}`);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date() 
        }
      }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetExpires: null
      }
    });
  }
};

export default authService;