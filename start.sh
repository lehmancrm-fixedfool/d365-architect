#!/bin/bash
# D365 Architect OS — Start Script

set -e

echo "╔══════════════════════════════════════╗"
echo "║   D365 Architect OS — Starting       ║"
echo "╚══════════════════════════════════════╝"
echo

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check .env
if [ ! -f "$DIR/.env" ]; then
    echo "[!] .env not found. Copying from .env.example..."
    cp "$DIR/.env.example" "$DIR/.env"
    echo "[!] Edit .env and add your ANTHROPIC_API_KEY, then run ./start.sh again."
    exit 1
fi

# Backend
echo "[1/2] Starting backend (port 8000)..."
cd "$DIR/backend"
pip install -q -r requirements.txt
python main.py &
BACKEND_PID=$!

# Wait
sleep 2

# Frontend
echo "[2/2] Starting frontend (port 5173)..."
cd "$DIR/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo
echo "✓ D365 Architect OS running"
echo
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo
echo "Press Ctrl+C to stop."

# Open browser
sleep 3
if command -v open &>/dev/null; then
    open http://localhost:5173
elif command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:5173
fi

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
