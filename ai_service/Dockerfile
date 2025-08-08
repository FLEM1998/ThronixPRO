FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy application files
COPY . .

# Train the model
RUN python model_trainer.py

# Expose port
EXPOSE 5001

# Start the application
CMD ["python", "app.py"]