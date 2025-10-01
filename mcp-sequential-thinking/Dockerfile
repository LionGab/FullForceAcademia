# Multi-stage build for MCP Sequential Thinking Server
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv for faster Python package management
RUN pip install uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml ./
COPY README.md ./

# Install Python dependencies
RUN uv venv && \
    . .venv/bin/activate && \
    uv pip install -e .

# Production stage
FROM python:3.11-slim as production

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app/src"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user
RUN groupadd -r mcpuser && useradd -r -g mcpuser mcpuser

# Set working directory
WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv

# Copy application source
COPY src/ /app/src/
COPY pyproject.toml /app/
COPY README.md /app/

# Create directories for data and logs
RUN mkdir -p /data /var/log /app/config && \
    chown -R mcpuser:mcpuser /app /data /var/log

# Copy configuration templates
COPY config/ /app/config/

# Health check script
COPY scripts/healthcheck.py /app/scripts/healthcheck.py
RUN chmod +x /app/scripts/healthcheck.py

# Switch to non-root user
USER mcpuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python /app/scripts/healthcheck.py

# Default command
CMD ["python", "-m", "mcp_sequential_thinking.server"]

# Development stage (optional)
FROM production as development

USER root

# Install development dependencies
RUN . /app/.venv/bin/activate && \
    uv pip install -e .[dev]

# Install additional development tools
RUN apt-get update && apt-get install -y \
    vim \
    htop \
    tree \
    && rm -rf /var/lib/apt/lists/*

USER mcpuser

# Development command with auto-reload
CMD ["python", "-m", "mcp_sequential_thinking.server", "--dev"]