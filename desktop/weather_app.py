"""
WeatherView Desktop App
Cross-platform desktop weather application
Uses PyInstaller for distribution - completely free and open source
"""

import sys
import os
import subprocess
import threading
import time
import webbrowser

# Add backend to path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend')
sys.path.insert(0, backend_dir)

# Try to import Flask app
try:
    from app import app
    SERVER_AVAILABLE = True
except ImportError:
    SERVER_AVAILABLE = False


def print_banner():
    """Display a simple startup banner."""
    banner = """
    ============================================
       WeatherView Desktop
       Free & Open Source Weather Forecast
    ============================================

    Starting weather server...
    """
    print(banner)


def launch_server():
    """Launch the Flask server in a separate thread."""
    from app import app

    port = int(os.environ.get('PORT', 5000))

    print(f"  Server starting at http://localhost:{port}")
    print(f"  Opening browser automatically...")
    print(f"  Please wait...\n")

    # Start server
    app.run(host='127.0.0.1', port=port, debug=False, use_reloader=False)


def open_browser():
    """Open browser after a short delay."""
    time.sleep(2)
    webbrowser.open(f'http://localhost:5000')


def main():
    """Main entry point for desktop app."""
    print_banner()

    if not SERVER_AVAILABLE:
        print("""
    Error: Could not start weather server.

    Please install dependencies:
        pip install flask flask-cors requests

    Then run:
        python weather/backend/app.py
        """)
        input("\n    Press Enter to exit...")
        sys.exit(1)

    # Start server thread
    server_thread = threading.Thread(target=launch_server, daemon=True)
    server_thread.start()

    # Open browser
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()

    try:
        # Keep running until interrupted
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n  Thank you for using WeatherView!")
        print("  See you next time!\n")
        sys.exit(0)


if __name__ == '__main__':
    main()
