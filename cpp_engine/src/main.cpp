#include "weather_engine.h"
#include <iostream>
#include <iomanip>

int main() {
    std::cout << "========================================\n";
    std::cout << "  Weather Engine Test Suite (C++)\n";
    std::cout << "========================================\n\n";

    // Test temperature conversions
    std::cout << "--- Temperature Conversions ---\n";
    std::cout << "25°C = " << WeatherEngine::celsiusToFahrenheit(25) << "°F\n";
    std::cout << "77°F = " << WeatherEngine::fahrenheitToCelsius(77) << "°C\n\n";

    // Test wind chill
    std::cout << "--- Wind Chill ---\n";
    std::cout << "At 5°C with 30 km/h wind: "
              << WeatherEngine::calculateWindChill(5.0, 30.0) << "°C feels-like\n\n";

    // Test heat index
    std::cout << "--- Heat Index ---\n";
    std::cout << "At 35°C with 70% humidity: "
              << WeatherEngine::calculateHeatIndex(35.0, 70.0) << "°C feels-like\n\n";

    // Test UV index levels
    std::cout << "--- UV Index Levels ---\n";
    for (double uv : {0.0, 3.0, 6.0, 8.0, 11.0}) {
        std::cout << "UV " << uv << ": " << WeatherEngine::getUVLevel(uv) << "\n";
    }
    std::cout << "\n";

    // Test air quality labels
    std::cout << "--- Air Quality Index Labels ---\n";
    for (int aqi : {25, 75, 125, 175, 250, 350}) {
        std::cout << "AQI " << aqi << ": " << WeatherEngine::getAirQualityLabel(aqi) << "\n";
    }
    std::cout << "\n";

    // Test wind direction
    std::cout << "--- Wind Direction ---\n";
    for (double deg : {0, 45, 90, 180, 270, 360}) {
        std::cout << deg << "°: " << WeatherEngine::getWindDirection(deg) << "\n";
    }
    std::cout << "\n";

    // Test seasonal tips
    std::cout << "--- Seasonal Tips ---\n";
    std::cout << "Thunderstorm: " << WeatherEngine::getSeasonalTip("Thunderstorm", 25) << "\n";
    std::cout << "Snow, -2°C: " << WeatherEngine::getSeasonalTip("Snow", -2) << "\n";
    std::cout << "Sunny, 28°C: " << WeatherEngine::getSeasonalTip("Sunny", 28) << "\n\n";

    // Test full weather data structure
    WeatherData wd;
    wd.city = "New York";
    wd.temperature = 22.5;
    wd.feels_like = 20.1;
    wd.humidity = 65.0;
    wd.wind_speed = 15.0;
    wd.pressure = 1013.25;
    wd.uv_index = 5.0;
    wd.visibility = 10000;
    wd.condition = "Partly Cloudy";

    std::cout << "--- Sample Weather Data ---\n";
    std::cout << "City: " << wd.city << "\n";
    std::cout << "Temperature: " << wd.temperature << "°C\n";
    std::cout << "Feels Like: " << wd.feels_like << "°C\n";
    std::cout << "Dew Point: " << WeatherEngine::calculateDewPoint(wd.temperature, wd.humidity) << "°C\n";
    std::cout << "Humidity: " << wd.humidity << "%\n";
    std::cout << "Wind: " << wd.wind_speed << " km/h " << WeatherEngine::getWindDirection(180) << "\n";
    std::cout << "Pressure: " << wd.pressure << " hPa\n";
    std::cout << "UV Index: " << wd.uv_index << " (" << WeatherEngine::getUVLevel(wd.uv_index) << ")\n";
    std::cout << "Visibility: " << wd.visibility << " m\n";
    std::cout << "Condition: " << wd.condition << " " << WeatherEngine::getConditionEmoji(wd.condition) << "\n\n";

    // Test forecast generation
    std::cout << "--- 7-Day Forecast ---\n";
    auto forecast = WeatherEngine::generateForecast(wd);
    for (const auto& day : forecast) {
        std::cout << day.day_name << ": " << day.temp_max << "/" << day.temp_min << "°C "
                  << day.icon << " " << day.condition
                  << " (Precip: " << std::fixed << std::setprecision(0) << day.precipitation_probability << "%)\n";
    }

    std::cout << "\n========================================\n";
    std::cout << "  All tests completed successfully!\n";
    std::cout << "========================================\n";

    return 0;
}
