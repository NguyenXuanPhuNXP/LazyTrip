# Use an official lightweight Python image
FROM python:3.10-slim

# Set working directory inside the container
WORKDIR /app

# Copy requirement files first (to leverage Docker layer caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the remaining source code
COPY . .

# Expose the API port
EXPOSE 8000

# Command to run the application (same as manual step)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
