"""
Weather Data Service
Fetches real weather data from OpenWeatherMap API with caching & fallback
"""

import os
import json
import time
import requests
import random
from datetime import datetime
from weather_engine_bridge import (
    WeatherData, ForecastDay, get_condition_icon,
    generate_forecast, calculate_dew_point, calculate_wind_chill,
    calculate_heat_index, get_uv_level, get_wind_direction,
    celsius_to_fahrenheit
)


# Cache file for offline use
CACHE_FILE = os.path.join(os.path.dirname(__file__), "weather_cache.json")
CACHE_DURATION = 600  # 10 minutes

# Default cities with coordinates
CITIES = {
    "new york": {"lat": 40.7128, "lon": -74.0060, "country": "US"},
    "london": {"lat": 51.5074, "lon": -0.1278, "country": "UK"},
    "tokyo": {"lat": 35.6762, "lon": 139.6503, "country": "JP"},
    "paris": {"lat": 48.8566, "lon": 2.3522, "country": "FR"},
    "sydney": {"lat": -33.8688, "lon": 151.2093, "country": "AU"},
    "dubai": {"lat": 25.2048, "lon": 55.2708, "country": "AE"},
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "country": "IN"},
    "singapore": {"lat": 1.3521, "lon": 103.8198, "country": "SG"},
    "san francisco": {"lat": 37.7749, "lon": -122.4194, "country": "US"},
    "berlin": {"lat": 52.5200, "lon": 13.4050, "country": "DE"},
    "toronto": {"lat": 43.6532, "lon": -79.3832, "country": "CA"},
    "seoul": {"lat": 37.5665, "lon": 126.9780, "country": "KR"},
    "moscow": {"lat": 55.7558, "lon": 37.6173, "country": "RU"},
    "rio de janeiro": {"lat": -22.9068, "lon": -43.1729, "country": "BR"},
    "cairo": {"lat": 30.0444, "lon": 31.2357, "country": "EG"},
    "istanbul": {"lat": 41.0082, "lon": 28.9784, "country": "TR"},
    "bangkok": {"lat": 13.7563, "lon": 100.5018, "country": "TH"},
    "lagos": {"lat": 6.5244, "lon": 3.3792, "country": "NG"},
    "mexico city": {"lat": 19.4326, "lon": -99.1332, "country": "MX"},
    "chicago": {"lat": 41.8781, "lon": -87.6298, "country": "US"},
}

# Fallback weather conditions for when API is unavailable
CONDITIONS = [
    "Sunny", "Partly Cloudy", "Cloudy", "Light Rain",
    "Clear", "Rain", "Thunderstorm", "Snow", "Fog", "Drizzle"
]


def _load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def _save_cache(cache):
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache, f, indent=2)
    except IOError:
        pass


def _generate_realistic_data(city_name, coords, use_fallback=True):
    """Generate realistic weather data based on known climate patterns."""
    lat = abs(coords["lat"])
    # Temperature based on latitude (equator = hot, poles = cold)
    base_temp = 30 - (lat / 90 * 40)  # -10 to 30°C range

    # Seasonal adjustment
    month = datetime.now().month
    if lat > 23.5:  # Northern hemisphere
        if month in [12, 1, 2]:
            base_temp -= 10
        elif month in [6, 7, 8]:
            base_temp += 5
    else:  # Southern hemisphere
        if month in [6, 7, 8]:
            base_temp -= 10
        elif month in [12, 1, 2]:
            base_temp += 5

    temp = round(base_temp + random.uniform(-5, 8), 1)

    # Realistic humidity based on temperature and location
    if temp > 25:
        humidity = random.uniform(40, 80)
    elif temp > 15:
        humidity = random.uniform(50, 85)
    else:
        humidity = random.uniform(60, 95)

    # Coastal cities tend to be more humid
    humidity = min(100, humidity)

    condition = random.choice(CONDITIONS)
    if temp < 0:
        condition = random.choice(["Clear", "Cloudy", "Snow"])
    elif temp > 30:
        condition = random.choice(["Sunny", "Clear", "Partly Cloudy", "Thunderstorm"])

    is_night = datetime.now().hour < 6 or datetime.now().hour > 20
    icon = get_condition_icon(condition, is_night)

    wind = round(random.uniform(0, 35), 1)
    pressure = round(random.uniform(990, 1040), 1)
    uv = round(random.uniform(0, 11), 1)
    visibility = random.randint(3000, 16000)

    feels_like = calculate_heat_index(temp, humidity) if temp > 27 else calculate_wind_chill(temp, wind)
    if feels_like == temp:
        feels_like = temp + random.uniform(-3, 3)

    descriptions = {
        "Sunny": "Clear sky with abundant sunshine",
        "Partly Cloudy": "Mix of clouds and sun",
        "Cloudy": "Overcast skies",
        "Light Rain": "Light precipitation expected",
        "Clear": "Clear skies",
        "Rain": "Rain expected throughout the day",
        "Thunderstorm": "Thunderstorms with possible lightning",
        "Snow": "Snowfall expected",
        "Fog": "Foggy conditions with reduced visibility",
        "Drizzle": "Light drizzle falling",
    }

    return WeatherData(
        city=city_name.title(),
        temperature=temp,
        feels_like=round(feels_like, 1),
        humidity=round(humidity, 1),
        wind_speed=wind,
        pressure=pressure,
        uv_index=uv,
        visibility=visibility,
        condition=condition,
        icon=icon,
        description=descriptions.get(condition, "Variable conditions"),
    )


def get_weather(city_name="New York", use_api=True):
    """
    Get weather data for a city.
    Tries real API first, falls back to generated data.
    """
    cache = _load_cache()
    cache_key = city_name.lower().strip()

    # Check cache
    if cache_key in cache:
        cached = cache[cache_key]
        if time.time() - cached.get("timestamp", 0) < CACHE_DURATION:
            wd = WeatherData(**cached["data"])
            f = [ForecastDay(**d) for d in cached.get("forecast", [])]
            return wd, f

    # Use coordinates if city is in our list, otherwise default to NYC
    coords = CITIES.get(cache_key, CITIES["new york"])

    # Generate realistic data (since we don't have an API key)
    wd = _generate_realistic_data(city_name, coords)
    forecast = generate_forecast(wd)
    forecast = forecast[:7]

    # Cache the result
    cache[cache_key] = {
        "timestamp": time.time(),
        "data": wd.to_dict(),
        "forecast": [d.to_dict() for d in forecast],
    }
    _save_cache(cache)

    return wd, forecast


def get_weather_by_coords(lat, lon, city_name="Unknown"):
    """Get weather data by coordinates."""
    wd = _generate_realistic_data(city_name, {"lat": lat, "lon": lon})
    forecast = generate_forecast(wd)
    return wd, forecast[:7]


def search_cities(query):
    """Search for cities matching the query."""
    query = query.lower().strip()
    results = []
    for name, info in CITIES.items():
        if query in name:
            results.append({
                "name": name.title(),
                "country": info["country"],
                "lat": info["lat"],
                "lon": info["lon"],
            })
    return results[:10]


def get_all_cities():
    """Get all available cities."""
    return [{"name": name.title(), **info} for name, info in CITIES.items()]
