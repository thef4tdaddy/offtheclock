#!/bin/bash

# Off The Clock - Local Development Starter
set -e

# Cleanup function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit
}

# Trap interrupts
trap cleanup SIGINT SIGTERM

echo "🚀 Starting Off The Clock Dev Environment..."

# 1. Backend Setup
echo "🐍 Checking Backend Environment..."
if [ -d "venv" ]; then
    source venv/bin/activate
    echo "✅ Virtual environment activated."
else
    echo "⚠️  No 'venv' directory found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    if [ -f "requirements.txt" ]; then
        echo "📦 Installing dependencies from requirements.txt..."
        pip install -r requirements.txt
    fi
fi

# Start Backend in Background
echo "🔥 Starting FastAPI Server (Port 8000)..."
cd backend
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 2

# 2. Frontend Setup
echo "⚛️  Starting Frontend (Port 5173)..."
cd frontend
# Ensure check-root doesn't block dev start if it fails strict checks, but it should be fine.
npm run dev &
FRONTEND_PID=$!
cd ..

echo "✅ Environment is running!"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend:  http://localhost:8000"
echo "   (Press Ctrl+C to stop)"

# Wait for processes
wait
