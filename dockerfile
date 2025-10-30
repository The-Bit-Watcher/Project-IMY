# Dockerfile
FROM node:18-alpine

# Install necessary tools
RUN apk add --no-cache bash

# Create app directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/ ./backend/

# Copy frontend files
COPY frontend/package*.json ./frontend/
COPY frontend/ ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm ci
RUN npm run build

# Install serve for frontend
RUN npm install -g serve

# Go back to root directory
WORKDIR /app

# Create a startup script
RUN echo '#!/bin/bash' > start.sh && \
    echo 'echo "Starting backend server..."' >> start.sh && \
    echo 'cd /app/backend && npm start &' >> start.sh && \
    echo 'echo "Starting frontend server..."' >> start.sh && \
    echo 'cd /app/frontend && serve -s build -l 3000' >> start.sh && \
    chmod +x start.sh

# Expose ports (backend on 5000, frontend on 3000)
EXPOSE 3000 5000

# Start both services
CMD ["./start.sh"]