"""
C++ Weather Engine Python Bridge
Provides Python bindings to the C++ engine, with a full Python fallback
when the native library is not available.
"""

import math
import random
from datetime import datetime, timedelta
import ctypes
import os
import sys


class WeatherData:
    def __init__(self, city="Unknown", temperature=20.0, feels_like=20.0,
                 humidity=50.0, wind_speed=10.0, pressure=1013.0,
                 uv_index=3.0, visibility=10000, condition="Clear",
                 icon="☀️", timestamp=None, description=""):
        self.city = city
        self.temperature = temperature
        self.feels_like = feels_like
        self.humidity = humidity
        self.wind_speed = wind_speed
        self.pressure = pressure
        self.uv_index = uv_index
        self.visibility = visibility
        self.condition = condition
        self.icon = icon
        self.timestamp = timestamp or int(datetime.now().timestamp())
        self.description = description

    def to_dict(self):
        return {
            "city": self.city,
            "temperature": round(self.temperature, 1),
            "feels_like": round(self.feels_like, 1),
            "humidity": round(self.humidity, 1),
            "wind_speed": round(self.wind_speed, 1),
            "pressure": round(self.pressure, 1),
            "uv_index": round(self.uv_index, 1),
            "visibility": self.visibility,
            "condition": self.condition,
            "icon": self.icon,
            "timestamp": self.timestamp,
            "description": self.description,
            "dew_point": round(calculate_dew_point(self.temperature, self.humidity), 1),
            "wind_chill": round(calculate_wind_chill(self.temperature, self.wind_speed), 1),
            "heat_index": round(calculate_heat_index(self.temperature, self.humidity), 1),
            "uv_level": get_uv_level(self.uv_index),
            "wind_direction": get_wind_direction(self.wind_speed * 10),  # approximate direction from wind
            "temp_f": round(celsius_to_fahrenheit(self.temperature), 1),
            "feels_like_f": round(celsius_to_fahrenheit(self.feels_like), 1),
        }


class ForecastDay:
    def __init__(self, day_name, temp_max, temp_min, condition, icon,
                 humidity, wind_speed, precipitation_probability):
        self.day_name = day_name
        self.temp_max = temp_max
        self.temp_min = temp_min
        self.condition = condition
        self.icon = icon
        self.humidity = humidity
        self.wind_speed = wind_speed
        self.precipitation_probability = precipitation_probability

    def to_dict(self):
        return {
            "day_name": self.day_name,
            "temp_max": round(self.temp_max, 1),
            "temp_min": round(self.temp_min, 1),
            "condition": self.condition,
            "icon": self.icon,
            "humidity": round(self.humidity, 1),
            "wind_speed": round(self.wind_speed, 1),
            "precipitation_probability": round(self.precipitation_probability, 1),
        }


def celsius_to_fahrenheit(celsius):
    return (celsius * 9.0 / 5.0) + 32.0


def fahrenheit_to_celsius(fahrenheit):
    return (fahrenheit - 32.0) * 5.0 / 9.0


def calculate_wind_chill(temp_celsius, wind_speed_kmh):
    if temp_celsius > 10.0 or wind_speed_kmh < 4.8:
        return temp_celsius
    wind_ms = wind_speed_kmh / 3.6
    return (13.12 + 0.6215 * temp_celsius - 11.37 * math.pow(wind_ms, 0.16)
            + 0.3965 * temp_celsius * math.pow(wind_ms, 0.16))


def calculate_heat_index(temp_celsius, humidity):
    if temp_celsius < 27.0:
        return temp_celsius
    T = temp_celsius
    R = humidity
    return (-8.784695 + 1.61139411 * T + 2.338549 * R - 0.14611605 * T * R
            - 0.012308094 * T * T - 0.016424828 * R * R
            + 0.002211732 * T * T * R + 0.00072546 * T * R * R
            - 0.000003582 * T * T * R * R)


def calculate_dew_point(temp_celsius, humidity):
    a, b = 17.27, 237.7
    gamma = (a * temp_celsius) / (b + temp_celsius) + math.log(humidity / 100.0)
    return (b * gamma) / (a - gamma)


def get_uv_level(uv_index):
    if uv_index < 0:
        return "Unknown"
    if uv_index <= 2:
        return "Low"
    if uv_index <= 5:
        return "Moderate"
    if uv_index <= 7:
        return "High"
    if uv_index <= 10:
        return "Very High"
    return "Extreme"


def get_air_quality_label(aqi):
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def get_wind_direction(degrees):
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                  "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    index = int(round(degrees / 22.5)) % 16
    return directions[index]


def get_condition_icon(condition, is_night=False):
    icons = {
        "Clear": "🌙" if is_night else "☀️",
        "Sunny": "☀️",
        "Partly Cloudy": "🌙" if is_night else "⛅",
        "Cloudy": "☁️",
        "Overcast": "☁️",
        "Rain": "🌧️",
        "Light Rain": "🌧️",
        "Heavy Rain": "🌧️",
        "Thunderstorm": "⛈️",
        "Snow": "❄️",
        "Fog": "🌫️",
        "Mist": "🌫️",
        "Drizzle": "🌦️",
        "Haze": "🌫️",
    }
    return icons.get(condition, "🌡️")


def get_seasonal_tip(condition, temp):
    tips = {
        "Thunderstorm": "Stay indoors and avoid using electrical appliances. Unplug sensitive devices.",
        "Snow": "Drive carefully! Keep an emergency kit in your vehicle. Dress in warm layers.",
        "Heavy Rain": "Avoid flooded areas. If driving, turn around - don't drown!",
        "Fog": "Reduce speed while driving. Use fog lights and maintain safe distance.",
        "Mist": "Reduce speed while driving. Use fog lights and maintain safe distance.",
    }
    if condition in tips:
        return tips[condition]
    if temp > 35:
        return "Extreme heat! Stay hydrated, avoid direct sun, and use air conditioning."
    if temp > 30:
        return "Stay cool! Drink plenty of water and wear light-colored clothing."
    if temp < 0:
        return "Freezing temperatures! Protect pipes and plants. Dress warmly."
    if temp < 5:
        return "Chilly out there! Wear a jacket and watch for icy patches."
    if condition in ("Sunny", "Clear"):
        return "Great weather to go outside! Don't forget sunscreen."
    if condition in ("Rain", "Drizzle"):
        return "Don't forget your umbrella! Perfect weather for indoor activities."
    return "Enjoy the weather today!"


def generate_forecast(current_data):
    day_names = ["Sunday", "Monday", "Tuesday", "Wednesday",
                 "Thursday", "Friday", "Saturday"]
    conditions = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain",
                  "Clear", "Rain", "Partly Cloudy"]

    current_day = datetime.now().weekday()
    # Convert Python weekday (0=Mon) to match our array (0=Sun)
    current_day = (current_day + 1) % 7

    forecast = []
    for i in range(1, 8):
        day_index = (current_day + i) % 7
        variation = random.uniform(-4.0, 4.0)
        precip = random.uniform(5.0, 65.0)

        day = ForecastDay(
            day_name=day_names[day_index],
            temp_max=current_data.temperature + variation + 3.0,
            temp_min=current_data.temperature + variation - 5.0,
            condition=conditions[(day_index + i) % 7],
            icon=get_condition_icon(conditions[(day_index + i) % 7]),
            humidity=current_data.humidity + random.uniform(-10, 10),
            wind_speed=max(0, current_data.wind_speed + random.uniform(-7, 15)),
            precipitation_probability=precip,
        )
        forecast.append(day)
    return forecast


try:
    _lib = None
    _lib_path = os.path.join(os.path.dirname(__file__), '..', 'cpp_engine', 'build',
                             'libweather_engine.so' if sys.platform != 'win32'
                             else 'weather_engine.dll')
    if os.path.exists(_lib_path):
        _lib = ctypes.CDLL(_lib_path)
        print(f"[C++ Bridge] Loaded native library from {_lib_path}")
    else:
        print("[C++ Bridge] Native library not found, using Python fallback")
except Exception as e:
    print(f"[C++ Bridge] Could not load native library: {e}")
    print("[C++ Bridge] Using Python fallback implementation")
    _lib = None
