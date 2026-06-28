"""
Weather Forecast Web App - Flask Backend API
Serves weather data, frontend, and PWA files
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from weather_service import get_weather, search_cities, get_all_cities, get_weather_by_coords

# Project root
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(ROOT_DIR, 'frontend')
ICONS_DIR = os.path.join(FRONTEND_DIR, 'icons')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)


# Serve frontend files
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/offline.html')
def offline():
    return send_from_directory(FRONTEND_DIR, 'offline.html')


@app.route('/manifest.json')
def manifest():
    return send_from_directory(FRONTEND_DIR, 'manifest.json')


@app.route('/sw.js')
def service_worker():
    return send_from_directory(FRONTEND_DIR, 'sw.js')


@app.route('/icons/<path:filename>')
def icons(filename):
    return send_from_directory(ICONS_DIR, filename)


@app.route('/screenshots/<path:filename>')
def screenshots(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'screenshots'), filename)


# API endpoints
@app.route('/api/weather')
def api_weather():
    city = request.args.get('city', 'New York')
    lat = request.args.get('lat')
    lon = request.args.get('lon')

    try:
        if lat and lon:
            lat_f = float(lat)
            lon_f = float(lon)
            wd, forecast = get_weather_by_coords(lat_f, lon_f, city)
        else:
            wd, forecast = get_weather(city)

        return jsonify({
            "success": True,
            "current": wd.to_dict(),
            "forecast": [d.to_dict() for d in forecast],
            "tip": wd.description,
            "seasonal_tip": "",
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
        }), 500


@app.route('/api/cities')
def api_cities():
    query = request.args.get('q', '')
    if query:
        results = search_cities(query)
    else:
        results = get_all_cities()
    return jsonify({"cities": results})


@app.route('/api/cities/all')
def api_cities_all():
    return jsonify({"cities": get_all_cities()})


# Catch-all for static files (CSS, JS, etc.)
@app.route('/<path:path>')
def static_files(path):
    # Try frontend directory first
    full_path = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(full_path) and os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIR, path)
    # Fall back to index.html for SPA-like routing
    return send_from_directory(FRONTEND_DIR, 'index.html')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"*** Weather App Server starting on port {port} ***")
    print(f"*** Open http://localhost:{port} in your browser ***")
    print(f"*** Mobile: Open on your phone and Add to Home Screen ***")
    app.run(host='0.0.0.0', port=port, debug=True)
