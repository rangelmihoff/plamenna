# Stage 1: Build the frontend
# Use the 'slim' variant for better compatibility with native modules
FROM node:18.18.0-slim AS builder
# Set a higher memory limit for the build process just in case
ENV NODE_OPTIONS=--max-old-space-size=4096
WORKDIR /app
# Copy package files
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
# Use 'npm ci' for reliable installs
RUN npm ci
# Copy the rest of the frontend source code
COPY frontend/ .
# Run the build
RUN npm run build
# Stage 2: Setup the production backend
FROM node:18.18.0-slim
WORKDIR /app
# Unset the memory limit for the runtime environment
ENV NODE_OPTIONS=""
# Copy backend package files
COPY backend/package*.json ./
COPY backend/package-lock.json ./
# Install backend dependencies
RUN npm ci --omit=dev
# Copy the rest of the backend source code
COPY backend/ ./
# Copy the built frontend assets from the builder stage
COPY --from=builder /app/frontend/dist ./frontend/dist
# Expose the port the app will run on
EXPOSE 8081
# Command to run the application
CMD ["node", "server.js"]
