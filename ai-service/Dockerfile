FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (optional but safe)
RUN apt-get update && apt-get install -y build-essential

# Copy requirements first (better Docker caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy rest of the app
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]