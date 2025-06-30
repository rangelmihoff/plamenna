# Stage 1: Frontend Builder
# Builds the static frontend assets in a completely isolated environment.
FROM node:18.18.0-slim AS frontend-builder
WORKDIR /app
# Copy the entire frontend folder content directly into the workdir.
COPY frontend/ .
# Run install and build.
RUN npm install
RUN npm run build
# Stage 2: Backend Builder
# Prepares the backend code and production dependencies in another isolated environment.
FROM node:18.18.0-slim AS backend-builder
WORKDIR /app
# Copy the entire backend folder content into the workdir.
COPY backend/ .
# Install only production dependencies.
RUN npm install --omit=dev
# Stage 3: Final Production Image
# Assembles the final, clean image from the previous stages.
FROM node:18.18.0-slim
WORKDIR /app
# Copy the prepared backend (source + node_modules) from the backend-builder stage.
COPY --from=backend-builder /app/ .
# Copy the built frontend assets from the frontend-builder stage into the correct final location.
COPY --from=frontend-builder /app/dist ./frontend/dist
# Expose the port.
EXPOSE 8081
# Set the final command to run the server.
CMD ["node", "server.js"]