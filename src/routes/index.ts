import express from 'express';
import authRoutes from './auth.routes';

const router = express.Router();

// Register all routes
router.use('/auth', authRoutes);

// For future expansion, add other routes here:
// router.use('/users', userRoutes);

export default router;