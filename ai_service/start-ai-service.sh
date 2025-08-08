#!/bin/bash

echo "Starting ThronixPRO AI Strategy Engine..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not installed. Please install Python 3.11+"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Train the machine learning model
echo "Training ML model..."
python model_trainer.py

# Initialize database table
echo "Initializing AI usage tracking database..."
python init_db.py

# Check if required environment variables are set
if [ -z "$OPENAI_API_KEY" ]; then
    echo "Warning: OPENAI_API_KEY environment variable not set"
    echo "AI strategy generation will use fallback mode"
fi

if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL environment variable not set"
    echo "Usage tracking will not be available"
fi

# Start the AI service
echo "Starting AI service on port 5001..."
python app.py