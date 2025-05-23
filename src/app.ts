import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Server } from 'http';

// Load environment variables
dotenv.config();

// Import routes
import routes from './routes';

// Import middlewares
import errorMiddleware from './middlewares/error.middleware';
import { logger } from './utils/logger';

// Create Express application
const app = express();

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON request bodies
app.use(morgan('dev')); // Request logging

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Start server
const PORT = process.env.PORT || 3001;
// Capture the server instance returned by app.listen()
let server: Server;

// Only start the server if not in a test environment (to avoid double-listening)
// In test environment, supertest will handle starting a temporary server.
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    logger.info(`Auth service running on port ${PORT}`);
  });
} else {
  // In test environment, we still need to assign 'server' for type consistency,
  // but it won't be actively listening from this file's perspective.
  // Supertest handles the server lifecycle internally when you pass `app` to it.
  server = {} as Server; // A dummy assignment for type safety in test env
}


export default app;
export { server }; // Export the server instance
