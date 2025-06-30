# Stage 1: Frontend Builder
# This stage builds the static frontend assets in an isolated environment.
FROM node:18.18.0-slim AS frontend-builder
WORKDIR /app
# Copy the frontend source code into the build stage
COPY frontend/ .
RUN npm install
RUN npm run build
# Stage 2: Backend Builder
# This stage prepares the production backend dependencies and source code.
FROM node:18.18.0-slim AS backend-builder
WORKDIR /app
# Copy the backend source code into the build stage
COPY backend/ .
RUN npm install --omit=dev
# Stage 3: Final Production Image
# This is the final, clean image that will run in production.
FROM node:18.18.0-slim
WORKDIR /app
# Copy the prepared backend (source + node_modules) from the backend-builder stage.
# This places everything from the /app folder in the builder (which contains the backend code)
# directly into the /app folder of the final image.
# So server.js is now at /app/server.js, package.json is at /app/package.json etc.
COPY --from=backend-builder /app/ .
# Copy the built frontend assets from the frontend-builder stage.
# The destination path needs to be correct for the Express static server to find it.
COPY --from=frontend-builder /app/dist ./frontend/dist
# Expose the port.
EXPOSE 8081
# Set the final command to run the server. The WORKDIR is /app, and server.js is directly in /app.
CMD ["node", "server.js"]