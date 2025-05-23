import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Create Prisma client singleton
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log database queries in development environment
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e);
});

// Simple connection test
async function testConnection() {
  try {
    // Execute a simple query to test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
  }
}

export { prisma, testConnection };