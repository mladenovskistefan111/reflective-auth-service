# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup
USER appuser

COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /app/node_modules/ ./node_modules/
COPY --from=builder --chown=appuser:appgroup /app/dist/ ./dist/

COPY --from=builder --chown=appuser:appgroup /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=appuser:appgroup /app/node_modules/.prisma/client/ ./node_modules/.prisma/client/

EXPOSE 3001

CMD ["node", "dist/server.js"]