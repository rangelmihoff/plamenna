# Backend Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .

ENV NODE_ENV production
ENV PORT 3001
EXPOSE 3001

CMD ["node", "server.js"]