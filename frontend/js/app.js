/**
 * WeatherView - Main Application Script
 * Handles UI, API calls, animations, and chart rendering
 */

class WeatherApp {
    constructor() {
        this.currentCity = 'New York';
        this.weatherData = null;
        this.forecastData = null;
        this.favorites = JSON.parse(localStorage.getItem('weather_favs') || '[]');
        this.theme = localStorage.getItem('weather_theme') || 'light';
        this.chartInstance = null;
        this.toastTimeout = null;
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupDOMReferences();
        this.setupEventListeners();
        this.createParticles();
        this.renderCityList();
        this.loadWeather(this.currentCity);
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    setupDOMReferences() {
        this.dom = {
            cityName: document.getElementById('cityName'),
            dateTime: document.getElementById('dateTime'),
            weatherDesc: document.getElementById('weatherDesc'),
            weatherIcon: document.getElementById('weatherIcon'),
            temperature: document.getElementById('temperature'),
            feelsLike: document.getElementById('feelsLike'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('windSpeed'),
            pressure: document.getElementById('pressure'),
            uvIndex: document.getElementById('uvIndex'),
            dewPoint: document.getElementById('dewPoint'),
            visibility: document.getElementById('visibility'),
            windChill: document.getElementById('windChill'),
            tempF: document.getElementById('tempF'),
            forecastContainer: document.getElementById('forecastContainer'),
            hourlyScroll: document.getElementById('hourlyScroll'),
            weatherTip: document.getElementById('weatherTip'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            searchInput: document.getElementById('searchInput'),
            searchResults: document.getElementById('searchResults'),
            cityList: document.getElementById('cityList'),
            refreshBtn: document.getElementById('refreshBtn'),
            favBtn: document.getElementById('favBtn'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            sidebar: document.getElementById('sidebar'),
            themeBtn: document.getElementById('themeBtn'),
            chartContainer: document.getElementById('chartContainer'),
            forecastContainerEl: document.getElementById('forecastContainer'),
            toast: document.getElementById('toast'),
        };
    }

    setupEventListeners() {
        // Search
        this.dom.searchInput.addEventListener('input', (e) => {
            this.debounce(() => this.searchCities(e.target.value), 300)();
        });

        this.dom.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = e.target.value.trim();
                if (city) {
                    this.loadWeather(city);
                    this.dom.searchResults.classList.remove('active');
                    e.target.blur();
                }
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.dom.searchResults.classList.remove('active');
            }
        });

        // Refresh
        this.dom.refreshBtn.addEventListener('click', () => this.loadWeather(this.currentCity));

        // Favorite
        this.dom.favBtn.addEventListener('click', () => this.toggleFavorite());

        // Sidebar toggle
        this.dom.sidebarToggle.addEventListener('click', () => {
            this.dom.sidebar.classList.toggle('open');
        });

        // Close sidebar on main content click (mobile)
        this.dom.cityList.addEventListener('click', (e) => {
            const item = e.target.closest('.city-item');
            if (item) {
                const city = item.dataset.city;
                this.loadWeather(city);
                this.dom.sidebar.classList.remove('open');
                this.updateActiveCity(city);
            }
        });

        // Theme toggle
        this.dom.themeBtn.addEventListener('click', () => this.toggleTheme());

        // Forecast view toggle
        document.querySelectorAll('.forecast-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.forecast-nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const view = btn.dataset.view;
                if (view === 'cards') {
                    this.dom.forecastContainerEl.style.display = 'grid';
                    this.dom.chartContainer.style.display = 'none';
                } else {
                    this.dom.forecastContainerEl.style.display = 'none';
                    this.dom.chartContainer.style.display = 'block';
                    this.renderChart();
                }
            });
        });
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('weather_theme', this.theme);
        this.applyTheme();
        this.showToast(`Switched to ${this.theme} mode`, 'success');
    }

    updateClock() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        this.dom.dateTime.textContent = now.toLocaleDateString('en-US', options);
    }

    createParticles() {
        const canvas = document.getElementById('particles-canvas');
        const count = 30;

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            const size = Math.random() * 6 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${Math.random() * 20 + 15}s`;
            particle.style.animationDelay = `${Math.random() * 20}s`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            canvas.appendChild(particle);
        }
    }

    async loadWeather(city) {
        this.showLoading(true);
        this.currentCity = city;

        try {
            const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await response.json();

            if (!data.success) {
                this.showToast(data.error || 'Failed to load weather data', 'error');
                this.showLoading(false);
                return;
            }

            this.weatherData = data.current;
            this.forecastData = data.forecast;
            this.updateUI();
            this.updateFavoriteButton();
            this.showLoading(false);
        } catch (error) {
            console.error('Weather fetch error:', error);
            this.showToast('Could not connect to server. Make sure it is running.', 'error');
            this.showLoading(false);
        }
    }

    updateUI() {
        const w = this.weatherData;
        if (!w) return;

        // Animate number transitions
        this.animateNumber('cityName', w.city, false);
        this.animateNumber('weatherDesc', w.description || w.condition, false);

        // Icon with float animation reset
        this.dom.weatherIcon.textContent = w.icon || '☀️';
        this.dom.weatherIcon.style.animation = 'none';
        void this.dom.weatherIcon.offsetHeight;
        this.dom.weatherIcon.style.animation = 'float 4s ease-in-out infinite';

        this.animateNumberValue(this.dom.temperature, `${Math.round(w.temperature)}°C`);
        this.animateNumberValue(this.dom.feelsLike, `${Math.round(w.feels_like)}°C`);
        this.animateNumberValue(this.dom.humidity, `${Math.round(w.humidity)}%`);
        this.animateNumberValue(this.dom.windSpeed, `${w.wind_speed} km/h`);
        this.animateNumberValue(this.dom.pressure, `${Math.round(w.pressure)} hPa`);
        this.dom.uvIndex.textContent = w.uv_level || `${w.uv_index}`;
        this.animateNumberValue(this.dom.dewPoint, `${Math.round(w.dew_point)}°C`);
        this.animateNumberValue(this.dom.visibility, `${(w.visibility / 1000).toFixed(1)} km`);
        this.animateNumberValue(this.dom.windChill, `${Math.round(w.wind_chill)}°C`);
        this.animateNumberValue(this.dom.tempF, `${Math.round(w.temp_f)}°F`);

        // Render forecast
        this.renderForecast();
        this.renderHourly();
        this.renderWeatherTip(w);

        // Update background theme based on weather
        this.updateWeatherTheme(w.condition);
    }

    animateNumberValue(element, newValue) {
        element.style.transition = 'all 0.3s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(10px)';
        setTimeout(() => {
            element.textContent = newValue;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 150);
    }

    animateNumber(id, value, isNumber = false) {
        const el = this.dom[id];
        if (!el) return;
        el.textContent = value;
    }

    renderForecast() {
        if (!this.forecastData) return;

        const cards = this.forecastData.map((day, index) => {
            const delay = index * 0.07;
            return `
                <div class="forecast-card" style="animation-delay: ${delay}s">
                    <div class="forecast-day">${day.day_name}</div>
                    <div class="forecast-icon">${day.icon}</div>
                    <div class="forecast-temp">${Math.round(day.temp_max)}° / ${Math.round(day.temp_min)}°</div>
                    <div class="forecast-condition">${day.condition}</div>
                    <div class="forecast-precip">💧 ${Math.round(day.precipitation_probability)}%</div>
                </div>
            `;
        }).join('');

        this.dom.forecastContainerEl.innerHTML = cards;
    }

    renderChart() {
        if (!this.forecastData) return;

        const canvas = document.getElementById('tempChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.parentElement.offsetWidth || 800;
        canvas.height = 250;

        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const labels = this.forecastData.map(d => d.day_name.substring(0, 3));
        const highs = this.forecastData.map(d => Math.round(d.temp_max));
        const lows = this.forecastData.map(d => Math.round(d.temp_min));
        const precip = this.forecastData.map(d => Math.round(d.precipitation_probability));

        const isDark = this.theme === 'dark';
        const textColor = isDark ? '#94a3b8' : '#5a6b7d';
        const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const padding = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartWidth = canvas.width - padding.left - padding.right;
        const chartHeight = canvas.height - padding.top - padding.bottom;
        const pointSpacing = chartWidth / (labels.length - 1);

        // Find min/max for scaling
        const allTemps = [...highs, ...lows];
        const minTemp = Math.min(...allTemps) - 5;
        const maxTemp = Math.max(...allTemps) + 5;

        const scaleY = (val) => {
            return padding.top + chartHeight - ((val - minTemp) / (maxTemp - minTemp)) * chartHeight;
        };

        const scaleX = (index) => padding.left + index * pointSpacing;

        // Draw grid lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvas.width - padding.right, y);
            ctx.stroke();

            // Y-axis label
            const tempVal = maxTemp - ((maxTemp - minTemp) / 4) * i;
            ctx.fillStyle = textColor;
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(tempVal)}°`, padding.left - 8, y + 4);
        }

        // Draw high temp line with gradient fill
        const highGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        highGradient.addColorStop(0, 'rgba(255, 87, 34, 0.25)');
        highGradient.addColorStop(1, 'rgba(255, 87, 34, 0.0)');

        // High temp area
        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(highs[0]));
        for (let i = 0; i < highs.length; i++) {
            ctx.lineTo(scaleX(i), scaleY(highs[i]));
        }
        ctx.lineTo(scaleX(highs.length - 1), padding.top + chartHeight);
        ctx.lineTo(scaleX(0), padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = highGradient;
        ctx.fill();

        // High temp line
        ctx.beginPath();
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.moveTo(scaleX(0), scaleY(highs[0]));
        for (let i = 1; i < highs.length; i++) {
            const x = scaleX(i);
            const y = scaleY(highs[i]);
            const prevX = scaleX(i - 1);
            const prevY = scaleY(highs[i - 1]);
            const cpx = (prevX + x) / 2;
            ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
        ctx.stroke();

        // Low temp area
        const lowGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        lowGradient.addColorStop(0, 'rgba(33, 150, 243, 0.25)');
        lowGradient.addColorStop(1, 'rgba(33, 150, 243, 0.0)');

        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(lows[0]));
        for (let i = 0; i < lows.length; i++) {
            ctx.lineTo(scaleX(i), scaleY(lows[i]));
        }
        ctx.lineTo(scaleX(lows.length - 1), padding.top + chartHeight);
        ctx.lineTo(scaleX(0), padding.top + chartHeight);
        ctx.closePath();
        ctx.fillStyle = lowGradient;
        ctx.fill();

        // Low temp line
        ctx.beginPath();
        ctx.strokeStyle = '#2196f3';
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.moveTo(scaleX(0), scaleY(lows[0]));
        for (let i = 1; i < lows.length; i++) {
            const x = scaleX(i);
            const y = scaleY(lows[i]);
            const prevX = scaleX(i - 1);
            const prevY = scaleY(lows[i - 1]);
            const cpx = (prevX + x) / 2;
            ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
        }
        ctx.stroke();

        // Draw data points (highs)
        for (let i = 0; i < highs.length; i++) {
            const x = scaleX(i);
            const y = scaleY(highs[i]);

            // Glow effect
            const glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
            glow.addColorStop(0, 'rgba(255, 87, 34, 0.3)');
            glow.addColorStop(1, 'rgba(255, 87, 34, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();

            // Point
            ctx.fillStyle = '#ff5722';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();

            // Value label
            ctx.fillStyle = '#ff5722';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${highs[i]}°`, x, y - 10);
        }

        // Draw data points (lows)
        for (let i = 0; i < lows.length; i++) {
            const x = scaleX(i);
            const y = scaleY(lows[i]);

            const glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
            glow.addColorStop(0, 'rgba(33, 150, 243, 0.3)');
            glow.addColorStop(1, 'rgba(33, 150, 243, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2196f3';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2196f3';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${lows[i]}°`, x, y + 18);
        }

        // X-axis labels
        ctx.fillStyle = textColor;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < labels.length; i++) {
            ctx.fillText(labels[i], scaleX(i), canvas.height - 12);
        }

        // Legend
        const legendX = canvas.width - padding.right - 120;
        const legendY = padding.top + 5;

        ctx.fillStyle = '#ff5722';
        ctx.fillRect(legendX, legendY, 12, 3);
        ctx.fillStyle = textColor;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('High', legendX + 18, legendY + 4);

        ctx.fillStyle = '#2196f3';
        ctx.fillRect(legendX + 55, legendY, 12, 3);
        ctx.fillStyle = textColor;
        ctx.fillText('Low', legendX + 73, legendY + 4);
    }

    renderHourly() {
        if (!this.weatherData) return;

        const now = new Date();
        const hours = [];

        for (let i = 0; i < 24; i++) {
            const hour = new Date(now);
            hour.setHours(now.getHours() + i);
            const temp = this.weatherData.temperature + (Math.sin(i / 6 * Math.PI) * 4) + (Math.random() - 0.5) * 2;
            const icons = ['☀️', '🌤️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '🌫️'];
            const icon = icons[Math.floor(Math.random() * icons.length)];

            hours.push({
                time: hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                temp: Math.round(temp),
                icon: icon
            });
        }

        const items = hours.map(h => `
            <div class="hourly-item">
                <div class="hourly-time">${h.time}</div>
                <div class="hourly-icon">${h.icon}</div>
                <div class="hourly-temp">${h.temp}°</div>
            </div>
        `).join('');

        this.dom.hourlyScroll.innerHTML = items;
    }

    renderWeatherTip(w) {
        if (!w) return;

        const tips = {
            'Thunderstorm': 'Stay indoors and avoid using electrical appliances. Unplug sensitive devices.',
            'Snow': 'Drive carefully! Keep an emergency kit in your vehicle. Dress in warm layers.',
            'Heavy Rain': 'Avoid flooded areas. If driving, turn around - don\'t drown!',
            'Rain': 'Don\'t forget your umbrella! Perfect weather for indoor activities.',
            'Fog': 'Reduce speed while driving. Use fog lights and maintain safe distance.',
            'Mist': 'Reduce speed while driving. Use fog lights and maintain safe distance.',
            'Sunny': 'Great weather to go outside! Don\'t forget sunscreen.',
            'Clear': 'Great weather to go outside! Don\'t forget sunscreen.',
            'Partly Cloudy': 'Nice weather! A light jacket might be useful.',
            'Cloudy': 'Overcast skies - a good day for a walk in the park.',
            'Drizzle': 'Light rain - bring a light jacket or umbrella.',
            'Haze': 'Limited visibility - take care if driving.',
        };

        const tip = tips[w.condition] || 'Enjoy the weather today!';
        this.dom.weatherTip.textContent = tip;
    }

    updateWeatherTheme(condition) {
        // Weather-based background tint handled via CSS classes
        const root = document.documentElement;
        root.classList.remove('weather-sunny', 'weather-cloudy', 'weather-rain', 'weather-snow', 'weather-storm');
        if (['Sunny', 'Clear'].includes(condition)) root.classList.add('weather-sunny');
        else if (['Cloudy', 'Overcast', 'Partly Cloudy'].includes(condition)) root.classList.add('weather-cloudy');
        else if (['Rain', 'Light Rain', 'Heavy Rain', 'Drizzle'].includes(condition)) root.classList.add('weather-rain');
        else if (['Snow'].includes(condition)) root.classList.add('weather-snow');
        else if (['Thunderstorm'].includes(condition)) root.classList.add('weather-storm');
    }

    async searchCities(query) {
        if (query.length < 1) {
            this.dom.searchResults.classList.remove('active');
            return;
        }

        try {
            const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.cities && data.cities.length > 0) {
                const html = data.cities.map(city => `
                    <div class="search-result-item" data-city="${city.name}">
                        <span>📍</span>
                        <span>${city.name}</span>
                        <span style="margin-left:auto;color:var(--text-muted);font-size:12px;">${city.country}</span>
                    </div>
                `).join('');

                this.dom.searchResults.innerHTML = html;
                this.dom.searchResults.classList.add('active');

                // Add click handlers
                this.dom.searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const city = item.dataset.city;
                        this.loadWeather(city);
                        this.dom.searchInput.value = city;
                        this.dom.searchResults.classList.remove('active');
                        this.updateActiveCity(city);
                    });
                });
            } else {
                this.dom.searchResults.classList.remove('active');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    renderCityList() {
        const cities = [
            { name: 'New York', emoji: '🗽', country: 'US' },
            { name: 'London', emoji: '🇬🇧', country: 'UK' },
            { name: 'Tokyo', emoji: '🗼', country: 'JP' },
            { name: 'Paris', emoji: '🏰', country: 'FR' },
            { name: 'Sydney', emoji: '🦘', country: 'AU' },
            { name: 'Dubai', emoji: '🏙️', country: 'AE' },
            { name: 'Mumbai', emoji: '🕌', country: 'IN' },
            { name: 'Singapore', emoji: '🦁', country: 'SG' },
            { name: 'Berlin', emoji: '🏛️', country: 'DE' },
            { name: 'Toronto', emoji: '🍁', country: 'CA' },
            { name: 'Seoul', emoji: '🇰🇷', country: 'KR' },
            { name: 'Rio de Janeiro', emoji: '⛰️', country: 'BR' },
            { name: 'Cairo', emoji: '🏜️', country: 'EG' },
            { name: 'Istanbul', emoji: '🕌', country: 'TR' },
            { name: 'Bangkok', emoji: '🏯', country: 'TH' },
            { name: 'Moscow', emoji: '🏛️', country: 'RU' },
            { name: 'Chicago', emoji: '🏙️', country: 'US' },
            { name: 'San Francisco', emoji: '🌉', country: 'US' },
            { name: 'Mexico City', emoji: '🌮', country: 'MX' },
            { name: 'Lagos', emoji: '🌍', country: 'NG' },
        ];

        const html = cities.map(city => `
            <div class="city-item ${city.name === this.currentCity ? 'active' : ''}" data-city="${city.name}">
                <span class="city-emoji">${city.emoji}</span>
                <span class="city-name-text">${city.name}</span>
                <span class="city-country">${city.country}</span>
            </div>
        `).join('');

        this.dom.cityList.innerHTML = `
            <div class="city-list-header">Popular Cities</div>
            ${html}
        `;
    }

    updateActiveCity(city) {
        this.dom.cityList.querySelectorAll('.city-item').forEach(item => {
            item.classList.toggle('active', item.dataset.city === city);
        });
    }

    toggleFavorite() {
        const index = this.favorites.indexOf(this.currentCity);
        if (index > -1) {
            this.favorites.splice(index, 1);
            this.showToast(`Removed ${this.currentCity} from favorites`, 'success');
        } else {
            this.favorites.push(this.currentCity);
            this.showToast(`Added ${this.currentCity} to favorites`, 'success');
        }
        localStorage.setItem('weather_favs', JSON.stringify(this.favorites));
        this.updateFavoriteButton();
    }

    updateFavoriteButton() {
        const isFav = this.favorites.includes(this.currentCity);
        this.dom.favBtn.classList.toggle('active', isFav);
        this.dom.favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites';
    }

    showLoading(show) {
        this.dom.loadingOverlay.classList.toggle('active', show);
    }

    showToast(message, type = 'success') {
        this.dom.toast.textContent = message;
        this.dom.toast.className = `toast ${type}`;
        this.dom.toast.classList.add('show');

        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.dom.toast.classList.remove('show');
        }, 3000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeatherApp();
    window.weatherApp = app;
});
