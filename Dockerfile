# Stage 1: Build the frontend
# Use a specific Node.js version for consistency
FROM node:18.18.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy frontend package.json and lock file
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ ./

# Build the frontend application
RUN npm run build

# Stage 2: Setup the production backend
FROM node:18.18.0-alpine

WORKDIR /app

# Copy backend package.json and lock file
COPY backend/package*.json ./

# Install only production dependencies for the backend
RUN npm install --omit=dev

# Copy the rest of the backend source code
COPY backend/ ./

# Copy the built frontend static assets from the builder stage
# The path should be relative to the WORKDIR, which is /app
COPY --from=builder /app/dist ./frontend/dist

# Expose the port the app will run on.
# Railway provides the PORT environment variable automatically.
EXPOSE 8081

# Command to run the application
# We use server.js as the entry point
CMD ["node", "server.js"]
