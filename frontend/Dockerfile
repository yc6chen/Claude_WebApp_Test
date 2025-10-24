# Use official Node.js Alpine image for minimal footprint (under 6 MB base)
FROM node:18-alpine

# Add labels for metadata and organization
LABEL maintainer="Recipe App Team"
LABEL description="React frontend for Recipe Management Application"
LABEL version="1.0"

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
# package.json and package-lock.json change less frequently than application code
COPY package.json package-lock.json* ./

# Install dependencies with clean npm cache
# Use npm ci for faster, more reliable builds with lock file
RUN if [ -f package-lock.json ]; then \
        npm ci --only=production=false; \
    else \
        npm install; \
    fi && \
    npm cache clean --force

# Copy application code (most frequently changing layer)
COPY . .

# Change ownership to node user (already exists in node:alpine)
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Document the port the application listens on
EXPOSE 3000

# Set environment variable for React development server
ENV REACT_APP_API_URL=http://localhost:8000

# Use exec form of CMD for proper signal handling
CMD ["npm", "start"]
