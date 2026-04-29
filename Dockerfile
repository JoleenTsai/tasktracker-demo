FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set to production environment
ENV NODE_ENV=production

# Start the Express server using tsx
CMD ["npx", "tsx", "server.ts"]
