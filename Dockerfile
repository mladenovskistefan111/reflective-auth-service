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

COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --omit=dev && npm cache clean --force 

COPY --from=builder --chown=appuser:appgroup /app/dist/ ./dist/

COPY --from=builder --chown=appuser:appgroup /app/prisma/ ./prisma/

COPY --from=builder --chown=appuser:appgroup /app/node_modules/.prisma/client/ ./node_modules/.prisma/client/

COPY --from=builder --chown=appuser:appgroup /app/node_modules/prisma/ ./node_modules/prisma/

USER appuser

EXPOSE 3001
CMD ["node", "dist/server.js"]