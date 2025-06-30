# Stage 1: Frontend Builder
# This stage builds the static frontend assets. It remains unchanged.
FROM node:18.18.0-slim AS frontend-builder
WORKDIR /app
COPY frontend/ .
RUN npm install
RUN npm run build
# Stage 2: Final Production Image
# We combine the backend setup and final image into a single, more reliable stage.
FROM node:18.18.0-slim
WORKDIR /app
# Copy the backend source code and package files directly into the final image.
# This ensures all subdirectories like 'middleware', 'routes', etc., are present.
COPY backend/ .
# Install backend production dependencies directly in the final image.
RUN npm install --omit=dev
# Copy the pre-built frontend assets from the builder stage.
COPY --from=frontend-builder /app/dist ./frontend/dist
# Expose the port.
EXPOSE 8081
# Set the final command to run the server. The WORKDIR is /app, and server.js is here.
CMD ["node", "server.js"]