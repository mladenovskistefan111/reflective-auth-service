# Builder Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .


RUN npx prisma generate

RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

USER node

COPY --from=builder --chown=node:node /app/package*.json ./

COPY --from=builder --chown=node:node /app/node_modules/ ./node_modules/

COPY --from=builder --chown=node:node /app/dist/ ./dist/

COPY --from=builder --chown=node:node /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=node:node /app/node_modules/.prisma/client/ ./node_modules/.prisma/client/

EXPOSE 3001

CMD ["npm", "start"]