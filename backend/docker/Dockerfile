# =================================================
# CampusHat Backend — Development Dockerfile
# =================================================
# Python 3.11-slim base with PostgreSQL client support
# =================================================

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements/ /app/requirements/
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements/development.txt

# Copy project
COPY . /app/

# Expose port
EXPOSE 8000

# Default command for development
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
