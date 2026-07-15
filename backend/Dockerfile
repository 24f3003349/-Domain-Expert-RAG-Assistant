FROM python:3.12-slim

# Install system dependencies (including poppler, tesseract, and libmagic)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libmagic1 \
    poppler-utils \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast package installation
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Disable uv cache to keep image size small
ENV UV_NO_CACHE=true

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Synchronize dependencies using PyTorch CPU wheel index
RUN uv sync --frozen --no-install-project --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple

# Copy project files
COPY . .

# Install the project
RUN uv sync --frozen --index-url https://download.pytorch.org/whl/cpu --extra-index-url https://pypi.org/simple

# Set PATH to use the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
