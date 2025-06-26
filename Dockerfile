FROM node:18-alpine as builder
WORKDIR /app
COPY . .
RUN cd backend && npm install && npm run build
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/
RUN cd backend && npm install --only=production
WORKDIR /app/backend
EXPOSE 3001
CMD ["node", "server.js"]
В. Актуализирайте docker-compose.yml:
yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
    ports:
      - "3001:3001"
    env_file: .env
    depends_on:
      - mongo
  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - backend
  mongo:
    image: mongo:6.0
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: example
    ports:
      - "27017:27017"
volumes:
  mongodb_data: