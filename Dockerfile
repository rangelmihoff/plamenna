# Stage 1: Frontend Builder
# This stage builds the static frontend assets.
FROM node:18.18.0-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build
# Stage 2: Backend Dependencies
# This stage installs only the production backend dependencies.
FROM node:18.18.0-slim AS backend-dependencies
WORKDIR /app
COPY backend/package*.json ./
COPY backend/package-lock.json ./
RUN npm ci --omit=dev
# Stage 3: Final Production Image
# This is the final, clean image that will run in production.
FROM node:18.18.0-slim
WORKDIR /app
# Copy installed backend dependencies from the previous stage
COPY --from=backend-dependencies /app/node_modules ./node_modules
# Copy the backend source code
COPY backend/ .
# Copy the built frontend assets from the first stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
# Expose the port the app will run on
EXPOSE 8081
# Command to run the application
CMD ["node", "server.js"]
