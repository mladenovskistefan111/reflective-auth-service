import './observability.js';

import app from './app.js';
import { logger } from './utils/logger.js';
import { testConnection } from './config/database.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
      logger.info('OpenTelemetry instrumentation active');
    });

    const shutdown = () => {
      logger.info('Shutting down server...');
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}