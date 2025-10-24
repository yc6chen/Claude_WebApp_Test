# Use official Python slim image for smaller footprint
FROM python:3.11-slim

# Add labels for metadata and organization
LABEL maintainer="Recipe App Team"
LABEL description="Django REST API backend for Recipe Management Application"
LABEL version="1.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install system dependencies in a single layer
# Combine apt-get update with install to prevent stale cache
# Clean up apt lists to reduce image size
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
# Dependencies change less frequently than application code
COPY requirements.txt .

# Install Python dependencies with pinned versions
# Use --no-cache-dir to reduce image size
RUN pip install --no-cache-dir --upgrade pip==24.0 && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code (most frequently changing layer)
COPY . .

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Document the port the application listens on
EXPOSE 8000

# Use exec form of CMD for proper signal handling
CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]
