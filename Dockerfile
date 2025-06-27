# Stage 1: Build the frontend
# Use a specific Node.js version for consistency
FROM node:18.18.0-alpine AS builder
WORKDIR /app
# Copy only the package files first to a dedicated 'frontend' subdirectory to leverage Docker cache
COPY frontend/package*.json ./frontend/
# Set the working directory to where the package.json is
WORKDIR /app/frontend
# Install frontend dependencies
RUN npm install
# Now copy the rest of the frontend source code into the current directory (/app/frontend)
COPY frontend/ .
# Run the build from within the frontend directory, where index.html is located
RUN npm run build
# Stage 2: Setup the production backend
FROM node:18.18.0-alpine
WORKDIR /app
# Copy backend package files
COPY backend/package*.json ./
# Install only production dependencies for the backend
RUN npm install --omit=dev
# Copy backend source code
COPY backend/ ./
# Copy the built frontend assets from the builder stage
# The build output is now located at /app/frontend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
# Expose the port the app will run on. Railway provides this automatically.
EXPOSE 8081
# Command to run the application
CMD ["node", "server.js"]