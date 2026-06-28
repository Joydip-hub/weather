#!/bin/bash
# WeatherView - macOS Launcher
# Opens the WeatherView web app in your browser

echo "======================================"
echo "  WeatherView - Starting..."
echo "======================================"
echo ""

# Try to find Python
PYTHON=""
if command -v python3 &> /dev/null; then
    PYTHON="python3"
elif command -v python &> /dev/null; then
    PYTHON="python"
else
    echo "Error: Python is not installed."
    echo "Please install Python from https://python.org"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

echo "  Starting server..."
cd "$BACKEND_DIR" && $PYTHON app.py &
SERVER_PID=$!
sleep 3

echo "  Opening browser..."
open http://localhost:5000

echo ""
echo "  WeatherView is running at: http://localhost:5000"
echo "  Close this window to stop the server."
echo ""

# Wait for user to close
trap "kill $SERVER_PID 2>/dev/null; echo 'Server stopped.'" EXIT
wait $SERVER_PID
