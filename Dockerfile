# Use a single stage for simplicity and to avoid multi-stage pathing issues
FROM node:18.18.0-slim
# Set the main working directory for the project
WORKDIR /app
# Copy all project files into the container
COPY . .
# --- Install Backend Dependencies ---
# Move into the backend directory and install production dependencies
WORKDIR /app/backend
RUN npm install --omit=dev
# --- Install & Build Frontend ---
# Move into the frontend directory, install dependencies, and run the build
WORKDIR /app/frontend
RUN npm install
RUN npm run build
# --- Final Setup & CMD ---
# Set the final working directory to the backend folder where server.js is
WORKDIR /app/backend
# Expose the port the server will run on
EXPOSE 8081
# The command to start the server. Node will look for server.js in the current WORKDIR.
CMD ["node", "server.js"]