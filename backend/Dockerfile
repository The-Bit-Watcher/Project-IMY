# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use npm install instead of npm ci)
RUN npm install --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]