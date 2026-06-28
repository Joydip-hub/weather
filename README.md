# 🌤️ WeatherView - Daily Weather Forecast

A beautiful, feature-rich weather forecast application built with **Python**, **JavaScript**, and **C++**.
Completely free, open-source, and easy to use by everyone!

![Weather](https://img.shields.io/badge/Weather-Free-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.14+-blue)
![JS](https://img.shields.io/badge/JavaScript-ES6+-yellow)

---

## ✨ Features

### 🎨 Beautiful Unique Design
- **Animated background** with floating particles
- **Glassmorphism UI** with blur effects and subtle gradients
- **Dark/Light mode** toggle with smooth transitions
- **Responsive** - works perfectly on desktop, tablet, and mobile
- **Weather-themed** color schemes that adapt to conditions

### 🎯 Smooth Animations
- Floating weather icons with 3D-like motion
- Card hover effects with scale and shadow transitions
- Number transitions with smooth count-up effects
- Temperature chart with bezier curves
- Animated search with sliding results
- Particle system for dynamic backgrounds

### 🌍 Weather Data
- **Realistic weather simulation** based on geography and season
- **20+ major cities** worldwide with accurate climate patterns
- **Current conditions**, temperature, humidity, wind, pressure, UV index
- **7-day forecast** with temperature ranges and precipitation
- **24-hour hourly** breakdown
- **Weather tips** and safety recommendations

### 📱 Cross-Platform Desktop App
- Standalone executable (Windows, macOS, Linux)
- No installation required - just download and run
- Lightweight and fast
- Auto-launches in browser

---

## 🚀 Quick Start

### Option 1: Run the Web App

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/weather.git
cd weather

# 2. Install Python dependencies
pip install flask flask-cors requests

# 3. Start the server
python backend/app.py

# 4. Open in browser
# http://localhost:5000
```

### Option 2: Run the Desktop App

```bash
# Same as above, then:
python desktop/run_desktop.py
```

### Option 3: Build Standalone Executable

```bash
pip install pyinstaller
python desktop/run_desktop.py build
# Find the executable in desktop/dist/WeatherView.exe
```

---

## 🏗️ Architecture

```
weather/
├── cpp_engine/           # 🖥️ C++ Weather Processing Engine
│   ├── src/
│   │   ├── weather_engine.h     # Core API header
│   │   ├── weather_engine.cpp   # Implementation
│   │   └── main.cpp             # CLI test suite
│   ├── CMakeLists.txt
│   └── README.md
│
├── backend/              # 🐍 Python Flask Backend
│   ├── app.py                  # Flask API server
│   ├── weather_service.py       # Weather data service
│   ├── weather_engine_bridge.py # C++ bridge + Python fallback
│   └── requirements.txt
│
├── frontend/             # 🎨 JavaScript Frontend
│   ├── index.html              # Main page
│   ├── css/
│   │   └── style.css          # Beautiful styles + animations
│   └── js/
│       └── app.js             # Interactive weather app
│
├── desktop/              # 💻 Desktop Application
│   ├── weather_app.py          # Desktop launcher
│   └── run_desktop.py          # Run/build script
│
├── .gitignore
└── README.md
```

---

## 🔧 Technical Details

### C++ Engine (Weather Core)
The C++ engine provides high-performance weather computations:
- Temperature conversions (°C ↔ °F)
- Wind chill / Heat index calculation
- Dew point calculation
- UV index classification
- Air Quality Index labeling
- Wind direction from compass degrees
- 7-day forecast generation
- Seasonal weather safety tips

To compile the C++ engine:
```bash
cd cpp_engine
mkdir build && cd build
cmake ..
cmake --build .
```

### Python Backend
- **Framework:** Flask 3.x with CORS support
- **C++ Bridge:** Uses ctypes to load native library (with Python fallback)
- **Weather Service:** Generates realistic weather data based on:
  - Geographic latitude (equator = hot, poles = cold)
  - Seasonal adjustments (Northern/Southern hemisphere)
  - Coastal effects on humidity
  - Realistic condition selection based on temperature

### JavaScript Frontend
- **Pure vanilla JS** - no frameworks needed
- **Canvas-based temperature chart** with bezier curves
- **CSS animations** - particles, float, fade-up, slide-down
- **Local storage** for favorites and theme preferences
- **Debounced search** for smooth UX

---

## 🌐 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | Serve the frontend |
| `GET /api/weather?city=London` | Get weather for a city |
| `GET /api/weather?lat=40.71&lon=-74.01` | Get weather by coordinates |
| `GET /api/cities?q=New` | Search cities |
| `GET /api/cities/all` | List all cities |

---

## 📦 Dependencies

### Python
- flask
- flask-cors
- requests (future real API support)

### C++ (optional, for native performance)
- C++17 compatible compiler
- CMake 3.10+

### Desktop Build
- PyInstaller

---

## 🤝 Contributing

WeatherView is completely free and open source! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share with friends!

---

## 📄 License

MIT License - Free for everyone to use, modify, and share.

---

## 🙏 Made With Love

Built with ❤️ for everyone to use for free. Weather should be accessible to all!

---

*"The best thing one can do when it's raining is to let it rain." - Henry Wadsworth Longfellow*
