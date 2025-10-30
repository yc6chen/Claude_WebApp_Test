# Use official Playwright image (latest stable)
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

# Set working directory
WORKDIR /e2e

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy test files and configuration
COPY . .

# Set environment variables for Docker
ENV BASE_URL=http://frontend:3000
ENV CI=true

# Default command to run tests
CMD ["npx", "playwright", "test"]
