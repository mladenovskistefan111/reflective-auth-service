import authService from '../services/auth.service';
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';

const authController = {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response) {
    const { email, password, username, firstName, lastName } = req.body;
    
    const result = await authService.register({
      email,
      password,
      username,
      firstName,
      lastName
    });
    
    logger.info(`User registered: ${email}`);
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        userId: result.id,
        email: result.email,
        username: result.username
      }
    });
  },

  /**
   * Login a user
   */
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    
    const { accessToken, refreshToken, user } = await authService.login(email, password);
    
    // Set HTTP-only cookie with refresh token (more secure)
    // For simplicity, we're also returning it in the response body
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    logger.info(`User logged in: ${email}`);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      }
    });
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(req: Request, res: Response) {
    // Non-null assertion for req.user is applied here
    const userId = req.user!.id; 
    
    const user = await authService.getUserById(userId);
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response) {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }
    
    const { accessToken, newRefreshToken } = await authService.refreshToken(refreshToken);
    
    // Update refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    return res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  },

  /**
   * Logout user by invalidating refresh token
   */
  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  },

  /**
   * Verify user email with token
   */
  async verifyEmail(req: Request, res: Response) {
    const { token } = req.params;
    
    await authService.verifyEmail(token);
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  },

  /**
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    
    await authService.forgotPassword(email);
    
    return res.status(200).json({
      success: true,
      message: 'Password reset email sent if the email exists in our system'
    });
  },

  /**
   * Reset password with token
   */
  async resetPassword(req: Request, res: Response) {
    const { token } = req.params;
    const { password } = req.body;
    
    await authService.resetPassword(token, password);
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  }
};

export default authController;
