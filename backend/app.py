"""
Weather Forecast Web App - Flask Backend API
Serves weather data to the frontend with CORS support
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from weather_service import get_weather, search_cities, get_all_cities, get_weather_by_coords

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), '..', 'frontend'))
CORS(app)


@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


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


@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"*** Weather App Server starting on port {port} ***")
    print(f"*** Open http://localhost:{port} in your browser ***")
    app.run(host='0.0.0.0', port=port, debug=True)
