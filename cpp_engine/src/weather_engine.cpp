#include "weather_engine.h"
#include <sstream>
#include <iomanip>
#include <ctime>

double WeatherEngine::celsiusToFahrenheit(double celsius) {
    return (celsius * 9.0 / 5.0) + 32.0;
}

double WeatherEngine::fahrenheitToCelsius(double fahrenheit) {
    return (fahrenheit - 32.0) * 5.0 / 9.0;
}

double WeatherEngine::calculateWindChill(double temp_celsius, double wind_speed_kmh) {
    // Wind chill formula (only valid when temp <= 10°C and wind > 4.8 km/h)
    if (temp_celsius > 10.0 || wind_speed_kmh < 4.8) {
        return temp_celsius;
    }
    double wind_ms = wind_speed_kmh / 3.6;
    return 13.12 + 0.6215 * temp_celsius - 11.37 * std::pow(wind_ms, 0.16) + 0.3965 * temp_celsius * std::pow(wind_ms, 0.16);
}

double WeatherEngine::calculateHeatIndex(double temp_celsius, double humidity) {
    // Heat index formula (valid when temp >= 27°C)
    if (temp_celsius < 27.0) {
        return temp_celsius;
    }
    double T = temp_celsius;
    double R = humidity;
    return -8.784695 + 1.61139411 * T + 2.338549 * R - 0.14611605 * T * R
         - 0.012308094 * T * T - 0.016424828 * R * R
         + 0.002211732 * T * T * R + 0.00072546 * T * R * R
         - 0.000003582 * T * T * R * R;
}

double WeatherEngine::calculateDewPoint(double temp_celsius, double humidity) {
    double a = 17.27;
    double b = 237.7;
    double gamma = (a * temp_celsius) / (b + temp_celsius) + std::log(humidity / 100.0);
    return (b * gamma) / (a - gamma);
}

std::string WeatherEngine::getUVLevel(double uv_index) {
    if (uv_index < 0) return "Unknown";
    if (uv_index <= 2) return "Low";
    if (uv_index <= 5) return "Moderate";
    if (uv_index <= 7) return "High";
    if (uv_index <= 10) return "Very High";
    return "Extreme";
}

std::string WeatherEngine::getAirQualityLabel(int aqi) {
    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for Sensitive Groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very Unhealthy";
    return "Hazardous";
}

std::string WeatherEngine::getWindDirection(double degrees) {
    const char* directions[] = {"N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"};
    int index = static_cast<int>(std::round(degrees / 22.5)) % 16;
    return directions[index];
}

std::string WeatherEngine::getConditionEmoji(const std::string& condition) {
    if (condition == "Clear" || condition == "Sunny") return "\xF0\x9F\x94\x85"; // ☀️
    if (condition == "Partly Cloudy") return "\xE2\x9B\x85"; // ⛅
    if (condition == "Cloudy" || condition == "Overcast") return "\xE2\x98\x81"; // ☁️
    if (condition == "Rain" || condition == "Light Rain") return "\xF0\x9F\x8C\xA7"; // 🌧
    if (condition == "Heavy Rain") return "\xF0\x9F\x8C\xA8"; // 🌨
    if (condition == "Thunderstorm") return "\xE2\x9A\xA1"; // ⚡
    if (condition == "Snow") return "\xF0\x9F\x8C\xA8"; // ❄️
    if (condition == "Fog" || condition == "Mist") return "\xF0\x9F\x8C\xAB"; // 🌫
    if (condition == "Drizzle") return "\xF0\x9F\x8C\xA6"; // 🌦
    return "\xF0\x9F\x8C\xA1"; // 🌡
}

std::string WeatherEngine::getWeatherIcon(const std::string& condition, bool is_night) {
    if (condition == "Clear" || condition == "Sunny") {
        return is_night ? "🌙" : "\xF0\x9F\x94\x85";
    }
    if (condition == "Partly Cloudy") return is_night ? "\xF0\x9F\x8C\x91" : "\xE2\x9B\x85";
    if (condition == "Cloudy" || condition == "Overcast") return "\xE2\x98\x81";
    if (condition == "Rain" || condition == "Light Rain") return "\xF0\x9F\x8C\xA7";
    if (condition == "Heavy Rain") return "\xF0\x9F\x8C\xA8";
    if (condition == "Thunderstorm") return "\xE2\x9A\xA1";
    if (condition == "Snow") return "\xF0\x9F\x8C\xA8";
    if (condition == "Fog" || condition == "Mist") return "\xF0\x9F\x8C\xAB";
    if (condition == "Drizzle") return "\xF0\x9F\x8C\xA6";
    return "\xF0\x9F\x8C\xA1";
}

std::vector<ForecastDay> WeatherEngine::generateForecast(const WeatherData& current) {
    std::vector<ForecastDay> forecast;
    const char* day_names[] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
    std::string conditions[] = {"Sunny", "Partly Cloudy", "Cloudy", "Light Rain", "Clear", "Rain", "Partly Cloudy"};
    std::string icons[] = {"\xF0\x9F\x94\x85", "\xE2\x9B\x85", "\xE2\x98\x81", "\xF0\x9F\x8C\xA7", "\xF0\x9F\x94\x85", "\xF0\x9F\x8C\xA7", "\xE2\x9B\x85"};

    time_t now = time(nullptr);
    tm* local = localtime(&now);
    int current_day = local->tm_wday;

    for (int i = 1; i <= 7; i++) {
        int day_index = (current_day + i) % 7;
        double variation = (std::rand() % 100) / 100.0 * 8.0 - 4.0; // -4 to +4
        double precip = (std::rand() % 100) / 100.0 * 60.0 + 5.0; // 5% to 65%

        ForecastDay day;
        day.day_name = day_names[day_index];
        day.temp_max = current.temperature + variation + 3.0;
        day.temp_min = current.temperature + variation - 5.0;
        day.condition = conditions[(day_index + i) % 7];
        day.icon = icons[(day_index + i) % 7];
        day.humidity = current.humidity + (std::rand() % 20 - 10);
        day.wind_speed = current.wind_speed + (std::rand() % 15 - 7);
        day.precipitation_probability = precip;
        forecast.push_back(day);
    }
    return forecast;
}

double WeatherEngine::kmhToMph(double kmh) {
    return kmh * 0.621371;
}

double WeatherEngine::hPaToInHg(double hPa) {
    return hPa * 0.02953;
}

double WeatherEngine::mmToInches(double mm) {
    return mm * 0.0393701;
}

std::string WeatherEngine::getSeasonalTip(const std::string& condition, double temp) {
    if (condition == "Thunderstorm") {
        return "Stay indoors and avoid using electrical appliances. Unplug sensitive devices.";
    }
    if (condition == "Snow") {
        return "Drive carefully! Keep an emergency kit in your vehicle. Dress in warm layers.";
    }
    if (condition == "Heavy Rain") {
        return "Avoid flooded areas. If driving, turn around - don't drown!";
    }
    if (condition == "Fog" || condition == "Mist") {
        return "Reduce speed while driving. Use fog lights and maintain safe distance.";
    }
    if (temp > 35.0) {
        return "Extreme heat! Stay hydrated, avoid direct sun, and use air conditioning.";
    }
    if (temp > 30.0) {
        return "Stay cool! Drink plenty of water and wear light-colored clothing.";
    }
    if (temp < 0.0) {
        return "Freezing temperatures! Protect pipes and plants. Dress warmly.";
    }
    if (temp < 5.0) {
        return "Chilly out there! Wear a jacket and watch for icy patches.";
    }
    if (condition == "Sunny" || condition == "Clear") {
        return "Great weather to go outside! Don't forget sunscreen.";
    }
    if (condition == "Rain" || condition == "Drizzle") {
        return "Don't forget your umbrella! Perfect weather for indoor activities.";
    }
    return "Enjoy the weather today!";
}
