import express from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validation.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { registerSchema, loginSchema } from '../utils/validation-schemas.js';
import { catchAsync } from '../utils/catchAsync.js'; 

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
// validate is synchronous, no need for catchAsync here
router.post('/register', validate(registerSchema), catchAsync(authController.register)); 

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
// validate is synchronous, no need for catchAsync here
router.post('/login', validate(loginSchema), catchAsync(authController.login));

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', catchAsync(authController.refreshToken));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
// authMiddleware is synchronous, no need for catchAsync here
router.get('/me', authMiddleware, catchAsync(authController.getCurrentUser));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user by invalidating refresh token
 * @access  Private
 */
// authMiddleware is synchronous, no need for catchAsync here
router.post('/logout', authMiddleware, catchAsync(authController.logout));

/**
 * @route   POST /api/auth/verify-email/:token
 * @desc    Verify user email with token
 * @access  Public
 */
router.get('/verify-email/:token', catchAsync(authController.verifyEmail));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post('/forgot-password', catchAsync(authController.forgotPassword));

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password/:token', catchAsync(authController.resetPassword));

export default router;
