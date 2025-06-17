import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { withDatabaseSpan } from '../observability.js';

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'info' },
    { emit: 'event', level: 'warn' },
  ],
});

if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug({
      query: e.query,
      params: e.params,
      duration: e.duration,
      target: e.target,
    }, 'Prisma query executed');
  });
}

prisma.$on('error', (e) => {
  logger.error({ prismaError: e }, 'Prisma error occurred');
});

prisma.$on('info', (e) => {
  logger.info({ message: e.message, target: e.target }, 'Prisma info');
});

prisma.$on('warn', (e) => {
  logger.warn({ message: e.message, target: e.target }, 'Prisma warning');
});

async function testConnection() {
  return withDatabaseSpan(
    'db.connection.test',
    async () => {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('Database connection established successfully');
    },
    {
      'db.table': 'system',
      'db.operation': 'connection_test',
    }
  );
}

const SPECIAL_METHODS = new Set([
  '$on',
  '$use',
  '$connect',
  '$disconnect',
  '$transaction',
  '$extends',
  '$queryRaw',
  '$executeRaw',
]);

export const instrumentedPrisma = new Proxy(prisma, {
  get(target: typeof prisma, prop: keyof typeof prisma) {
    const original = target[prop];
    const propName = String(prop);

    if (SPECIAL_METHODS.has(propName)) {
      if (typeof original === 'function') {
        return (...args: any[]) => (original as any).call(target, ...args);
      }
      return original;
    }

    if (typeof original === 'function') {
      return (...args: any[]) =>
        withDatabaseSpan(
          `db.client.${propName}`,
          async () => await (original as any).call(target, ...args),
          { 'db.operation': propName }
        );
    }

    if (typeof original === 'object' && original !== null) {
      return new Proxy(original, {
        get(modelTarget: any, modelProp: string) {
          const modelOriginal = modelTarget[modelProp];
          if (typeof modelOriginal === 'function') {
            return (...args: any[]) =>
              withDatabaseSpan(
                `db.${propName}.${modelProp}`,
                async () => await modelOriginal.apply(modelTarget, args),
                {
                  'db.table': propName,
                  'db.operation': modelProp,
                }
              );
          }
          return modelOriginal;
        },
      });
    }

    return original;
  },
});

export { prisma, testConnection };
