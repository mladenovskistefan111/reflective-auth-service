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
  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<User> {
    // Check if user already exists
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

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Generate email verification token
    const verifyToken = uuidv4();

    // Create new user
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

    // In a real application, send verification email here
    logger.info(`Verification token for ${userData.email}: ${verifyToken}`);
    
    return user;
  },

  /**
   * Authenticate user and generate tokens
   */
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if email is verified (optional - you can enforce this or not)
    if (!user.isVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
      throw new ApiError(403, 'Please verify your email before logging in');
    }

    // Generate JWT token
    const accessToken = generateJwt({ 
      id: user.id, 
      email: user.email,
      role: user.role 
    }, '15m'); // Short-lived access token
    
    // Generate refresh token
    const refreshToken = uuidv4();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days
    
    // Save refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expires: refreshExpiresAt
      }
    });
    
    // Update last login timestamp
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

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(token: string) {
    // Find refresh token in database
    const refreshTokenRecord = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!refreshTokenRecord) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > refreshTokenRecord.expires) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: refreshTokenRecord.id }
      });
      throw new ApiError(401, 'Refresh token expired');
    }

    // Generate new access token
    const accessToken = generateJwt({ 
      id: refreshTokenRecord.user.id, 
      email: refreshTokenRecord.user.email,
      role: refreshTokenRecord.user.role 
    }, '15m');
    
    // Generate new refresh token (token rotation for security)
    const newRefreshToken = uuidv4();
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7); // 7 days
    
    // Update refresh token in database
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

  /**
   * Logout user by invalidating refresh token
   */
  async logout(token: string): Promise<void> {
    // Delete refresh token
    await prisma.refreshToken.deleteMany({
      where: { token }
    });
  },

  /**
   * Verify user email with token
   */
  async verifyEmail(token: string): Promise<void> {
    // Find user with verification token
    const user = await prisma.user.findFirst({
      where: { verifyToken: token }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid verification token');
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null
      }
    });
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Even if user doesn't exist, don't reveal that (security best practice)
    if (!user) {
      return;
    }

    // Generate reset token and set expiration
    const resetToken = uuidv4();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    // Update user with reset token and expiration
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetExpires
      }
    });

    // In a real application, send password reset email here
    logger.info(`Password reset token for ${email}: ${resetToken}`);
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find user with reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetExpires: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password and clear reset token
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