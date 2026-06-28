#ifndef WEATHER_ENGINE_H
#define WEATHER_ENGINE_H

#include <string>
#include <vector>
#include <cmath>

struct WeatherData {
    std::string city;
    double temperature;        // Celsius
    double feels_like;         // Celsius
    double humidity;           // percentage
    double wind_speed;         // km/h
    double pressure;           // hPa
    double uv_index;
    int visibility;            // meters
    std::string condition;     // e.g., "Clear", "Cloudy", "Rain"
    std::string icon;
    long timestamp;
};

struct ForecastDay {
    std::string day_name;
    double temp_max;
    double temp_min;
    std::string condition;
    std::string icon;
    double humidity;
    double wind_speed;
    double precipitation_probability;
};

class WeatherEngine {
public:
    static double celsiusToFahrenheit(double celsius);
    static double fahrenheitToCelsius(double fahrenheit);
    static double calculateWindChill(double temp_celsius, double wind_speed_kmh);
    static double calculateHeatIndex(double temp_celsius, double humidity);
    static double calculateDewPoint(double temp_celsius, double humidity);
    static std::string getUVLevel(double uv_index);
    static std::string getAirQualityLabel(int aqi);
    static std::string getWindDirection(double degrees);
    static std::string getConditionEmoji(const std::string& condition);
    static std::string getWeatherIcon(const std::string& condition, bool is_night);
    static std::vector<ForecastDay> generateForecast(const WeatherData& current);
    static double kmhToMph(double kmh);
    static double hPaToInHg(double hPa);
    static double mmToInches(double mm);
    static std::string getSeasonalTip(const std::string& condition, double temp);
};

#endif // WEATHER_ENGINE_H
