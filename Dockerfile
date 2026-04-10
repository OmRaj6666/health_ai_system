# Use an official, extremely lightweight Python runtime
FROM python:3.11-slim

# Set working directory in container
WORKDIR /app

# Copy the backend requirements first for caching
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files and frontend files
COPY backend /app/backend
COPY frontend /app/frontend

# Expose Cloud Run port
EXPOSE 8080

# Run FastAPI via Uvicorn. Set CWD to backend.
WORKDIR /app/backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
