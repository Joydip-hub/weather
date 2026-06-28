/**
 * WeatherView - Main Application Script
 * Enhanced with PWA support, keyboard shortcuts, mobile gestures
 */

class WeatherApp {
    constructor() {
        this.currentCity = localStorage.getItem('weather_last_city') || 'New York';
        this.weatherData = null;
        this.forecastData = null;
        this.favorites = JSON.parse(localStorage.getItem('weather_favs') || '[]');
        this.theme = localStorage.getItem('weather_theme') || 'light';
        this.chartInstance = null;
        this.toastTimeout = null;
        this.deferredPrompt = null;
        this.isOnline = navigator.onLine;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupDOMReferences();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        this.setupTouchGestures();
        this.setupOnlineStatus();
        this.registerServiceWorker();
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
            installPrompt: document.getElementById('installPrompt'),
            installBtn: document.getElementById('installBtn'),
            installDismiss: document.getElementById('installDismiss'),
            connectionBadge: document.getElementById('connectionBadge'),
            bottomNav: document.getElementById('bottomNav'),
            hourlyScrollLeft: document.getElementById('hourlyScrollLeft'),
            hourlyScrollRight: document.getElementById('hourlyScrollRight'),
            shortcutsHint: document.getElementById('shortcutsHint'),
        };
    }

    setupEventListeners() {
        // Search input
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

        // Close search on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.dom.searchResults.classList.remove('active');
            }
        });

        // Refresh
        this.dom.refreshBtn.addEventListener('click', () => {
            this.loadWeather(this.currentCity);
        });

        // Favorite
        this.dom.favBtn.addEventListener('click', () => this.toggleFavorite());

        // Sidebar toggle
        this.dom.sidebarToggle.addEventListener('click', () => {
            this.dom.sidebar.classList.toggle('open');
        });

        // Close sidebar on main content click (mobile)
        document.getElementById('mainContent').addEventListener('click', (e) => {
            if (window.innerWidth <= 992 && this.dom.sidebar.classList.contains('open')) {
                if (!e.target.closest('.sidebar')) {
                    this.dom.sidebar.classList.remove('open');
                }
            }
        });

        // City list click
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

        // Bottom navigation (mobile)
        if (this.dom.bottomNav) {
            this.dom.bottomNav.querySelectorAll('.nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.dom.bottomNav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                    const view = item.dataset.view;
                    this.scrollToSection(view);
                });
            });
        }

        // Hourly scroll buttons
        if (this.dom.hourlyScrollLeft) {
            this.dom.hourlyScrollLeft.addEventListener('click', () => {
                this.dom.hourlyScroll.scrollBy({ left: -200, behavior: 'smooth' });
            });
        }
        if (this.dom.hourlyScrollRight) {
            this.dom.hourlyScrollRight.addEventListener('click', () => {
                this.dom.hourlyScroll.scrollBy({ left: 200, behavior: 'smooth' });
            });
        }

        // Install PWA prompt
        if (this.dom.installDismiss) {
            this.dom.installDismiss.addEventListener('click', () => {
                this.dom.installPrompt.classList.remove('show');
                localStorage.setItem('pwa_dismissed', 'true');
            });
        }
        if (this.dom.installBtn) {
            this.dom.installBtn.addEventListener('click', () => this.installPWA());
        }

        // Before install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if (!localStorage.getItem('pwa_dismissed')) {
                setTimeout(() => this.showInstallPrompt(), 5000);
            }
        });

        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            this.dom.installPrompt.classList.remove('show');
            this.showToast('WeatherView installed successfully!', 'success');
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K - Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.dom.searchInput.focus();
                this.dom.searchInput.select();
                this.showShortcutsHint(false);
            }
            // Ctrl+R or Cmd+R - Refresh
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.loadWeather(this.currentCity);
            }
            // Ctrl+D or Cmd+D - Dark mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.toggleTheme();
            }
            // Ctrl+F or Cmd+F - Favorite
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.toggleFavorite();
            }
            // Escape - Close search / hints
            if (e.key === 'Escape') {
                this.dom.searchResults.classList.remove('active');
                this.dom.searchInput.blur();
                this.showShortcutsHint(false);
            }
            // ? - Show shortcuts hint
            if (e.key === '?' && !e.target.closest('input')) {
                this.showShortcutsHint();
            }
        });
    }

    setupTouchGestures() {
        const mainContent = document.getElementById('mainContent');

        mainContent.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        mainContent.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        // Pull to refresh on mobile
        let pullStartY = 0;
        mainContent.addEventListener('touchstart', (e) => {
            if (mainContent.scrollTop === 0) {
                pullStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        mainContent.addEventListener('touchmove', (e) => {
            if (mainContent.scrollTop === 0) {
                const pullDistance = e.touches[0].clientY - pullStartY;
                if (pullDistance > 80) {
                    this.loadWeather(this.currentCity);
                    pullStartY = 0;
                }
            }
        }, { passive: true });
    }

    handleSwipe() {
        const SWIPE_THRESHOLD = 80;
        const diff = this.touchEndX - this.touchStartX;

        if (Math.abs(diff) < SWIPE_THRESHOLD) return;

        if (diff > 0) {
            // Swipe right - open sidebar on mobile
            if (window.innerWidth <= 992) {
                this.dom.sidebar.classList.add('open');
            }
        } else {
            // Swipe left - close sidebar
            this.dom.sidebar.classList.remove('open');
        }
    }

    setupOnlineStatus() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.dom.connectionBadge.classList.remove('show');
            this.showToast('Back online!', 'success');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.dom.connectionBadge.classList.add('show');
            this.showToast('You are offline. Showing cached data.', 'error');
        });
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                console.log('ServiceWorker registered:', registration.scope);
            } catch (error) {
                console.log('ServiceWorker registration failed:', error);
            }
        }
    }

    showInstallPrompt() {
        if (this.deferredPrompt && this.dom.installPrompt) {
            this.dom.installPrompt.classList.add('show');
        }
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            this.showToast('Open browser menu → Add to Home Screen', 'success');
            return;
        }
        this.deferredPrompt.prompt();
        const result = await this.deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            this.showToast('Installing WeatherView...', 'success');
        }
        this.deferredPrompt = null;
        this.dom.installPrompt.classList.remove('show');
    }

    scrollToSection(view) {
        let target;
        switch (view) {
            case 'current':
                target = document.getElementById('currentWeather');
                break;
            case 'forecast':
                target = document.getElementById('forecastSection');
                break;
            case 'hourly':
                target = document.getElementById('hourlySection');
                break;
            case 'search':
                this.dom.searchInput.focus();
                this.dom.searchInput.select();
                return;
            default:
                return;
        }
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showShortcutsHint(show = true) {
        if (!this.dom.shortcutsHint) return;
        if (show) {
            this.dom.shortcutsHint.classList.toggle('show');
        } else {
            this.dom.shortcutsHint.classList.remove('show');
        }
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
        const count = window.innerWidth < 640 ? 15 : 30;

        canvas.innerHTML = '';
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
        if (!this.isOnline) {
            this.showToast('Cannot refresh while offline', 'error');
            return;
        }

        this.showLoading(true);
        this.currentCity = city;
        localStorage.setItem('weather_last_city', city);

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

        // Update document title
        document.title = `${Math.round(w.temperature)}°C ${w.city} - WeatherView`;

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

        this.renderForecast();
        this.renderHourly();
        this.renderWeatherTip(w);
        this.updateWeatherTheme(w.condition);
    }

    animateNumberValue(element, newValue) {
        if (!element) return;
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
        const parentWidth = canvas.parentElement.offsetWidth || 800;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = parentWidth * dpr;
        canvas.height = 280 * dpr;
        canvas.style.width = parentWidth + 'px';
        canvas.style.height = '280px';
        ctx.scale(dpr, dpr);

        const labels = this.forecastData.map(d => d.day_name.substring(0, 3));
        const highs = this.forecastData.map(d => Math.round(d.temp_max));
        const lows = this.forecastData.map(d => Math.round(d.temp_min));

        const isDark = this.theme === 'dark';
        const textColor = isDark ? '#94a3b8' : '#5a6b7d';
        const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

        ctx.clearRect(0, 0, parentWidth, 280);

        const padding = { top: 25, right: 20, bottom: 45, left: 45 };
        const chartWidth = parentWidth - padding.left - padding.right;
        const chartHeight = 280 - padding.top - padding.bottom;
        const pointSpacing = chartWidth / (labels.length - 1);

        const allTemps = [...highs, ...lows];
        const minTemp = Math.min(...allTemps) - 5;
        const maxTemp = Math.max(...allTemps) + 5;

        const scaleY = (val) => padding.top + chartHeight - ((val - minTemp) / (maxTemp - minTemp)) * chartHeight;
        const scaleX = (index) => padding.left + index * pointSpacing;

        // Grid lines
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(parentWidth - padding.right, y);
            ctx.stroke();
            const tempVal = maxTemp - ((maxTemp - minTemp) / 4) * i;
            ctx.fillStyle = textColor;
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${Math.round(tempVal)}°`, padding.left - 8, y + 4);
        }

        // High temp area fill
        const highGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        highGradient.addColorStop(0, isDark ? 'rgba(255,87,34,0.2)' : 'rgba(255,87,34,0.25)');
        highGradient.addColorStop(1, 'rgba(255,87,34,0.0)');
        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(highs[0]));
        for (let i = 0; i < highs.length; i++) ctx.lineTo(scaleX(i), scaleY(highs[i]));
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
            const x = scaleX(i), y = scaleY(highs[i]);
            const px = scaleX(i - 1), py = scaleY(highs[i - 1]);
            ctx.bezierCurveTo((px + x) / 2, py, (px + x) / 2, y, x, y);
        }
        ctx.stroke();

        // Low temp area fill
        const lowGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        lowGradient.addColorStop(0, isDark ? 'rgba(33,150,243,0.2)' : 'rgba(33,150,243,0.25)');
        lowGradient.addColorStop(1, 'rgba(33,150,243,0.0)');
        ctx.beginPath();
        ctx.moveTo(scaleX(0), scaleY(lows[0]));
        for (let i = 0; i < lows.length; i++) ctx.lineTo(scaleX(i), scaleY(lows[i]));
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
            const x = scaleX(i), y = scaleY(lows[i]);
            const px = scaleX(i - 1), py = scaleY(lows[i - 1]);
            ctx.bezierCurveTo((px + x) / 2, py, (px + x) / 2, y, x, y);
        }
        ctx.stroke();

        // Data points
        const drawPoints = (data, color) => {
            for (let i = 0; i < data.length; i++) {
                const x = scaleX(i), y = scaleY(data[i]);
                // Glow effect
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        drawPoints(highs, '#ff5722');
        drawPoints(lows, '#2196f3');

        // X-axis labels
        ctx.fillStyle = textColor;
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        for (let i = 0; i < labels.length; i++) {
            ctx.fillText(labels[i], scaleX(i), 280 - 12);
        }

        // Values on points (high)
        for (let i = 0; i < highs.length; i++) {
            if (i % 2 === 0) {
                ctx.fillStyle = '#ff5722';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${highs[i]}°`, scaleX(i), scaleY(highs[i]) - 10);
            }
        }
        // Values on points (low)
        for (let i = 1; i < lows.length; i += 2) {
            ctx.fillStyle = '#2196f3';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${lows[i]}°`, scaleX(i), scaleY(lows[i]) + 18);
        }

        // Legend
        const legendX = parentWidth - padding.right - 120;
        const legendY = padding.top + 5;
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(legendX, legendY, 12, 3);
        ctx.fillStyle = textColor;
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('High', legendX + 18, legendY + 4);
        ctx.fillStyle = '#2196f3';
        ctx.fillRect(legendX + 55, legendY, 12, 3);
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

        // Mark current hour
        hours[0].time = 'Now';
        hours[0].icon = this.weatherData.icon || '☀️';
        hours[0].temp = Math.round(this.weatherData.temperature);

        const items = hours.map((h, i) => `
            <div class="hourly-item ${i === 0 ? 'current' : ''}">
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
        this.dom.favBtn.title = isFav ? 'Remove from favorites' : 'Add to favorite';
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
            const later = () => { clearTimeout(timeout); func(...args); };
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
