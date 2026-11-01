/**
 * WeatherPulse — Live Weather Dashboard
 * Client Application Logic
 *
 * Implements:
 * - Telemetry fetching via serverless /api/weather proxy
 * - Stale request cancellation via AbortController
 * - Celsius / Fahrenheit unit conversions with immediate re-rendering
 * - 5-Day forecast rendering via Array.map()
 * - Dynamic theme adaptation (sunny, cloudy, rainy, snowy, night)
 * - Safe DOM updates (XSS prevention using textContent & node creation)
 * - Screen reader announcements and full keyboard navigation
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. APPLICATION STATE & PERSISTENCE
  // ==========================================================================
  const STORAGE_KEYS = {
    UNIT: 'weatherpulse_unit',
    LAST_CITY: 'weatherpulse_last_city'
  };

  const state = {
    currentUnit: 'C',
    weatherData: null,
    activeController: null,
    lastSearchedCity: 'Mumbai'
  };

  // ==========================================================================
  // 2. DOM ELEMENT REFERENCES
  // ==========================================================================
  const elements = {
    // Top Bar & Controls
    unitCelsiusBtn: document.getElementById('unit-celsius'),
    unitFahrenheitBtn: document.getElementById('unit-fahrenheit'),
    unitToggleWrapper: document.querySelector('.unit-toggle'),
    refreshBtn: document.getElementById('refresh-btn'),
    srAnnouncements: document.getElementById('sr-announcements'),

    // Search Section
    searchForm: document.getElementById('search-form'),
    cityInput: document.getElementById('city-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    searchSubmitBtn: document.getElementById('search-submit-btn'),
    quickChips: document.querySelectorAll('.chip-btn'),

    // State Views
    setupView: document.getElementById('setup-view'),
    setupRetryBtn: document.getElementById('setup-retry-btn'),
    loadingView: document.getElementById('loading-view'),
    loadingMessage: document.getElementById('loading-message'),
    errorView: document.getElementById('error-view'),
    errorTitle: document.getElementById('error-title'),
    errorMessage: document.getElementById('error-message'),
    errorRetryBtn: document.getElementById('error-retry-btn'),
    weatherContent: document.getElementById('weather-content'),

    // Hero Section
    currentCityName: document.getElementById('current-city-name'),
    currentRegionCountry: document.getElementById('current-region-country'),
    dayNightBadge: document.getElementById('day-night-badge'),
    dayNightLabel: document.getElementById('day-night-label'),
    localTime: document.getElementById('local-time'),
    currentTemp: document.getElementById('current-temp'),
    tempUnitHero: document.getElementById('temp-unit-hero'),
    feelsLikeVal: document.getElementById('feels-like-val'),
    currentConditionIcon: document.getElementById('current-condition-icon'),
    currentConditionText: document.getElementById('current-condition-text'),
    todayHigh: document.getElementById('today-high'),
    todayLow: document.getElementById('today-low'),

    // Detailed Telemetry
    metricHumidity: document.getElementById('metric-humidity'),
    humidityBar: document.getElementById('humidity-bar'),
    humidityDesc: document.getElementById('humidity-desc'),

    metricWindSpeed: document.getElementById('metric-wind-speed'),
    metricWindUnit: document.getElementById('metric-wind-unit'),
    metricWindDir: document.getElementById('metric-wind-dir'),
    windDesc: document.getElementById('wind-desc'),

    metricPressure: document.getElementById('metric-pressure'),
    metricPressureUnit: document.getElementById('metric-pressure-unit'),
    pressureBar: document.getElementById('pressure-bar'),
    pressureDesc: document.getElementById('pressure-desc'),

    metricUv: document.getElementById('metric-uv'),
    uvBadge: document.getElementById('uv-badge'),
    metricVisibility: document.getElementById('metric-visibility'),

    // 5-Day Forecast
    forecastCardsContainer: document.getElementById('forecast-cards-container'),
    forecastCountBadge: document.getElementById('forecast-count-badge')
  };

  // ==========================================================================
  // 3. UTILITY FUNCTIONS & FORMATTERS
  // ==========================================================================

  /**
   * Broadcast announcements to screen reader users
   */
  function announceToScreenReader(message) {
    if (elements.srAnnouncements) {
      elements.srAnnouncements.textContent = '';
      setTimeout(() => {
        elements.srAnnouncements.textContent = message;
      }, 50);
    }
  }

  /**
   * Convert Celsius to Fahrenheit
   */
  function celsiusToFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
  }

  /**
   * Format ISO date string into day name (e.g. "Mon", "Tue")
   */
  function formatDayName(dateString, isFirstDay = false) {
    if (isFirstDay) return 'Today';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } catch {
      return dateString;
    }
  }

  /**
   * Format date into month and day (e.g. "Nov 1")
   */
  function formatMonthDay(dateString) {
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  /**
   * Format 24-hr or 12-hr local time from provider string (e.g. "2024-10-25 17:30")
   */
  function formatDisplayTime(localtimeStr) {
    if (!localtimeStr) return '--:--';
    const parts = localtimeStr.split(' ');
    if (parts.length > 1) {
      return `Local ${parts[1]}`;
    }
    return localtimeStr;
  }

  /**
   * Determine atmospheric theme key based on weather condition code and daylight flag
   */
  function determineAtmosphericTheme(isDay, conditionCode, conditionText) {
    // Night takes precedence if not daytime
    if (isDay === 0) {
      return 'night';
    }

    const text = (conditionText || '').toLowerCase();

    // Snow condition codes
    const snowCodes = [1066, 1069, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282];
    if (snowCodes.includes(conditionCode) || text.includes('snow') || text.includes('blizzard') || text.includes('sleet') || text.includes('ice')) {
      return 'snowy';
    }

    // Rain / Storm condition codes
    const rainCodes = [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1273, 1276];
    if (rainCodes.includes(conditionCode) || text.includes('rain') || text.includes('drizzle') || text.includes('shower') || text.includes('thunder') || text.includes('storm')) {
      return 'rainy';
    }

    // Cloudy / Overcast / Mist condition codes
    const cloudCodes = [1006, 1009, 1030, 1135, 1147];
    if (cloudCodes.includes(conditionCode) || text.includes('cloud') || text.includes('overcast') || text.includes('mist') || text.includes('fog')) {
      return 'cloudy';
    }

    // Default to sunny / daylight azure
    return 'sunny';
  }

  // ==========================================================================
  // 4. VIEW MANAGEMENT (SETUP, LOADING, ERROR, SUCCESS)
  // ==========================================================================

  function showLoading(cityName) {
    elements.setupView.classList.add('hidden');
    elements.errorView.classList.add('hidden');
    elements.weatherContent.classList.add('hidden');
    elements.loadingView.classList.remove('hidden');

    const cleanName = cityName ? ` for "${cityName}"` : '';
    elements.loadingMessage.textContent = `Retrieving live meteorological telemetry${cleanName}...`;
    announceToScreenReader(`Fetching weather telemetry${cleanName}`);
  }

  function showSetupView() {
    elements.loadingView.classList.add('hidden');
    elements.errorView.classList.add('hidden');
    elements.weatherContent.classList.add('hidden');
    elements.setupView.classList.remove('hidden');
    announceToScreenReader('Setup required: Weather API key is not configured.');
  }

  function showError(title, message) {
    elements.loadingView.classList.add('hidden');
    elements.setupView.classList.add('hidden');
    elements.weatherContent.classList.add('hidden');

    elements.errorTitle.textContent = title || 'Unable to Fetch Telemetry';
    elements.errorMessage.textContent = message || 'An error occurred while connecting to the meteorological service.';
    elements.errorView.classList.remove('hidden');

    announceToScreenReader(`Error: ${elements.errorTitle.textContent}. ${elements.errorMessage.textContent}`);
  }

  function showWeatherContent() {
    elements.loadingView.classList.add('hidden');
    elements.setupView.classList.add('hidden');
    elements.errorView.classList.add('hidden');
    elements.weatherContent.classList.remove('hidden');
  }

  // ==========================================================================
  // 5. RENDERING PIPELINE
  // ==========================================================================

  /**
   * Render the complete weather dashboard with current telemetry and 5-day forecast
   */
  function renderWeatherDashboard(data) {
    if (!data || !data.current || !data.location) return;

    const isCelsius = state.currentUnit === 'C';
    const { current, location, forecast } = data;

    // 1. Dynamic Background Theme
    const theme = determineAtmosphericTheme(current.isDay, current.conditionCode, current.conditionText);
    document.body.setAttribute('data-theme', theme);

    // 2. Location Information (safe textContent)
    elements.currentCityName.textContent = location.name || '--';
    const regionCountryParts = [location.region, location.country].filter(Boolean);
    elements.currentRegionCountry.textContent = regionCountryParts.join(', ') || '';

    // Day/Night indicator
    if (current.isDay === 1) {
      elements.dayNightBadge.classList.remove('is-night');
      elements.dayNightLabel.textContent = 'Daytime';
    } else {
      elements.dayNightBadge.classList.add('is-night');
      elements.dayNightLabel.textContent = 'Nighttime';
    }

    elements.localTime.textContent = formatDisplayTime(location.localtime);

    // 3. Hero Temperature & Conditions
    const displayTemp = isCelsius ? current.tempC : current.tempF;
    const feelsLikeTemp = isCelsius ? current.feelsLikeC : current.feelsLikeF;

    elements.currentTemp.textContent = Math.round(displayTemp);
    elements.tempUnitHero.textContent = `°${state.currentUnit}`;
    elements.feelsLikeVal.textContent = `${Math.round(feelsLikeTemp)}°${state.currentUnit}`;

    elements.currentConditionText.textContent = current.conditionText || 'Clear';
    elements.currentConditionIcon.src = current.conditionIcon;
    elements.currentConditionIcon.alt = current.conditionText || 'Weather condition';

    // Today's High / Low from the first forecast day
    if (forecast && forecast.length > 0) {
      const todayForecast = forecast[0];
      const todayMax = isCelsius ? todayForecast.maxTempC : todayForecast.maxTempF;
      const todayMin = isCelsius ? todayForecast.minTempC : todayForecast.minTempF;
      elements.todayHigh.textContent = `${Math.round(todayMax)}°`;
      elements.todayLow.textContent = `${Math.round(todayMin)}°`;
    } else {
      elements.todayHigh.textContent = '--°';
      elements.todayLow.textContent = '--°';
    }

    // 4. Telemetry Metric 1: Humidity
    const humidityVal = current.humidity ?? 0;
    elements.metricHumidity.textContent = humidityVal;
    elements.humidityBar.style.width = `${Math.min(100, Math.max(0, humidityVal))}%`;

    let humidityDescText = 'Optimal moisture balance';
    if (humidityVal < 30) {
      humidityDescText = 'Dry air; low ambient vapor';
    } else if (humidityVal > 75) {
      humidityDescText = 'High moisture saturation';
    }
    elements.humidityDesc.textContent = humidityDescText;

    // 5. Telemetry Metric 2: Wind Speed & Direction
    const windSpeed = isCelsius ? current.windKph : current.windMph;
    const windUnit = isCelsius ? 'km/h' : 'mph';

    elements.metricWindSpeed.textContent = windSpeed;
    elements.metricWindUnit.textContent = windUnit;
    elements.metricWindDir.textContent = current.windDir || 'N';

    // Qualitative wind descriptor
    const kphSpeed = current.windKph ?? 0;
    let windDescText = 'Light air';
    if (kphSpeed < 5) windDescText = 'Calm conditions';
    else if (kphSpeed < 20) windDescText = 'Gentle breeze';
    else if (kphSpeed < 38) windDescText = 'Moderate breeze';
    else if (kphSpeed < 61) windDescText = 'Strong wind';
    else windDescText = 'High gale alert';
    elements.windDesc.textContent = windDescText;

    // 6. Telemetry Metric 3: Barometric Pressure
    const pressureVal = isCelsius ? current.pressureMb : current.pressureIn;
    const pressureUnit = isCelsius ? 'hPa' : 'inHg';

    elements.metricPressure.textContent = pressureVal;
    elements.metricPressureUnit.textContent = pressureUnit;

    // Pressure bar fill relative to standard ~1013 hPa (range 970 - 1050)
    const mbVal = current.pressureMb || 1013;
    const pressurePct = Math.min(100, Math.max(10, ((mbVal - 970) / (1050 - 970)) * 100));
    elements.pressureBar.style.width = `${pressurePct}%`;

    let pressureDescText = 'Standard sea-level pressure';
    if (mbVal > 1022) pressureDescText = 'High pressure system (Fair)';
    else if (mbVal < 1005) pressureDescText = 'Low pressure trough (Stormy)';
    elements.pressureDesc.textContent = pressureDescText;

    // 7. Telemetry Metric 4: UV Index & Visibility
    const uvVal = current.uv ?? 0;
    elements.metricUv.textContent = uvVal;

    elements.uvBadge.className = 'sub-badge';
    if (uvVal <= 2) {
      elements.uvBadge.textContent = 'Low';
    } else if (uvVal <= 5) {
      elements.uvBadge.textContent = 'Moderate';
      elements.uvBadge.classList.add('moderate');
    } else {
      elements.uvBadge.textContent = 'High';
      elements.uvBadge.classList.add('high');
    }

    const visVal = isCelsius
      ? `${current.visibilityKm} km`
      : `${Math.round(current.visibilityKm * 0.621371)} mi`;
    elements.metricVisibility.textContent = visVal;

    // 8. 5-Day Forecast Grid (Rendered using Array.map)
    renderForecastCards(forecast, isCelsius);

    // 9. Display Main Content Surface
    showWeatherContent();

    // 10. Screen Reader Audio Feedback
    announceToScreenReader(
      `Weather updated for ${location.name}: ${Math.round(displayTemp)} degrees ${isCelsius ? 'Celsius' : 'Fahrenheit'}, ${current.conditionText}. Humidity ${humidityVal} percent, wind ${windSpeed} ${windUnit}.`
    );
  }

  /**
   * Safely construct and render forecast cards using Array.map() and DocumentFragment
   */
  function renderForecastCards(forecastDays, isCelsius) {
    elements.forecastCardsContainer.innerHTML = '';

    if (!Array.isArray(forecastDays) || forecastDays.length === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.className = 'metric-footer-text';
      emptyNote.textContent = 'No multi-day forecast data currently available.';
      elements.forecastCardsContainer.appendChild(emptyNote);
      elements.forecastCountBadge.textContent = '0 Days';
      return;
    }

    elements.forecastCountBadge.textContent = `${forecastDays.length} Days`;
    const fragment = document.createDocumentFragment();

    // Render using Array.map()
    const cards = forecastDays.map((dayItem, index) => {
      const card = document.createElement('article');
      card.className = 'forecast-card';
      card.setAttribute('role', 'listitem');
      if (index === 0) {
        card.classList.add('is-today');
      }

      // 1. Day & Date Headings
      const dayName = document.createElement('h4');
      dayName.className = 'forecast-day';
      dayName.textContent = formatDayName(dayItem.date, index === 0);

      const dateSub = document.createElement('span');
      dateSub.className = 'forecast-date';
      dateSub.textContent = formatMonthDay(dayItem.date);

      // 2. Weather Icon
      const iconWrapper = document.createElement('div');
      iconWrapper.className = 'forecast-icon-wrapper';
      const iconImg = document.createElement('img');
      iconImg.className = 'forecast-icon';
      iconImg.src = dayItem.conditionIcon;
      iconImg.alt = dayItem.conditionText;
      iconImg.loading = 'lazy';
      iconImg.width = 58;
      iconImg.height = 58;
      iconWrapper.appendChild(iconImg);

      // 3. Condition Text
      const conditionP = document.createElement('p');
      conditionP.className = 'forecast-condition-text';
      conditionP.textContent = dayItem.conditionText;
      conditionP.title = dayItem.conditionText;

      // 4. Temperature Min / Max
      const tempRange = document.createElement('div');
      tempRange.className = 'forecast-temp-range';

      const maxVal = isCelsius ? dayItem.maxTempC : dayItem.maxTempF;
      const minVal = isCelsius ? dayItem.minTempC : dayItem.minTempF;

      const maxTemp = document.createElement('span');
      maxTemp.className = 'forecast-max-temp';
      maxTemp.textContent = `${Math.round(maxVal)}°`;
      maxTemp.title = `High: ${Math.round(maxVal)}°${state.currentUnit}`;

      const minTemp = document.createElement('span');
      minTemp.className = 'forecast-min-temp';
      minTemp.textContent = `${Math.round(minVal)}°`;
      minTemp.title = `Low: ${Math.round(minVal)}°${state.currentUnit}`;

      tempRange.appendChild(maxTemp);
      tempRange.appendChild(minTemp);

      // 5. Precipitation Probability Pill
      const precipChance = Math.max(dayItem.chanceOfRain || 0, dayItem.chanceOfSnow || 0);
      const precipBadge = document.createElement('span');
      precipBadge.className = 'forecast-precip-badge';

      // SVG Water drop icon
      precipBadge.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
        <span>${precipChance}%</span>
      `;
      precipBadge.title = `Chance of precipitation: ${precipChance}%`;

      // Assemble card
      card.appendChild(dayName);
      card.appendChild(dateSub);
      card.appendChild(iconWrapper);
      card.appendChild(conditionP);
      card.appendChild(tempRange);
      card.appendChild(precipBadge);

      return card;
    });

    cards.forEach((card) => fragment.appendChild(card));
    elements.forecastCardsContainer.appendChild(fragment);
  }

  // ==========================================================================
  // 6. ASYNC TELEMETRY FETCH & RACE CONDITION PREVENTION
  // ==========================================================================

  /**
   * Fetch weather data from /api/weather with AbortController race condition safety
   */
  async function fetchWeatherData(city) {
    const trimmedCity = (city || '').trim();

    if (!trimmedCity) {
      showError('City Required', 'Please enter a valid city name to inspect real-time weather.');
      return;
    }

    // Cancel any in-flight request to prevent race conditions
    if (state.activeController) {
      state.activeController.abort();
    }
    state.activeController = new AbortController();

    showLoading(trimmedCity);

    try {
      const endpoint = `/api/weather?city=${encodeURIComponent(trimmedCity)}`;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: state.activeController.signal
      });

      let jsonPayload;
      try {
        jsonPayload = await response.json();
      } catch {
        throw new Error('Received non-JSON response from serverless endpoint.');
      }

      // Check for serverless error responses
      if (!response.ok || jsonPayload.error) {
        const errCode = jsonPayload.error;
        const errMsg = jsonPayload.message || 'Failed to retrieve telemetry.';

        if (response.status === 503 && errCode === 'CONFIG_MISSING') {
          showSetupView();
          return;
        }

        if (response.status === 404 || errCode === 'CITY_NOT_FOUND') {
          showError(
            'Location Not Found',
            `Could not locate meteorological data for "${trimmedCity}". Please check the spelling or try a major nearby city.`
          );
          return;
        }

        if (response.status === 429 || errCode === 'RATE_LIMIT_EXCEEDED') {
          showError(
            'Service Quota Reached',
            'The weather telemetry service quota has been temporarily reached. Please retry in a few moments.'
          );
          return;
        }

        if (response.status === 400) {
          showError('Invalid Request', errMsg);
          return;
        }

        showError('Telemetry Station Error', errMsg);
        return;
      }

      // Successful fetch
      state.weatherData = jsonPayload.data;
      state.lastSearchedCity = trimmedCity;
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_CITY, state.weatherData.location.name || trimmedCity);
      } catch {
        // LocalStorage access restricted in some sandboxes
      }

      renderWeatherDashboard(state.weatherData);
    } catch (err) {
      // Ignore user-aborted requests triggered by a newer search
      if (err.name === 'AbortError') {
        return;
      }

      if (!navigator.onLine) {
        showError(
          'Network Offline',
          'You appear to be offline. Please verify your internet connection and try again.'
        );
        return;
      }

      showError(
        'Connection Error',
        'Could not communicate with the WeatherPulse API server. Ensure `npx vercel dev` is running.'
      );
    } finally {
      state.activeController = null;
    }
  }

  // ==========================================================================
  // 7. TEMPERATURE UNIT TOGGLE
  // ==========================================================================

  function setTemperatureUnit(unit) {
    if (unit !== 'C' && unit !== 'F') return;
    if (state.currentUnit === unit && state.weatherData) return;

    state.currentUnit = unit;

    try {
      localStorage.setItem(STORAGE_KEYS.UNIT, unit);
    } catch {
      // LocalStorage access restricted in some sandboxes
    }

    if (unit === 'C') {
      elements.unitCelsiusBtn.classList.add('active');
      elements.unitCelsiusBtn.setAttribute('aria-checked', 'true');
      elements.unitFahrenheitBtn.classList.remove('active');
      elements.unitFahrenheitBtn.setAttribute('aria-checked', 'false');
      elements.unitToggleWrapper.classList.remove('fahrenheit-active');
    } else {
      elements.unitFahrenheitBtn.classList.add('active');
      elements.unitFahrenheitBtn.setAttribute('aria-checked', 'true');
      elements.unitCelsiusBtn.classList.remove('active');
      elements.unitCelsiusBtn.setAttribute('aria-checked', 'false');
      elements.unitToggleWrapper.classList.add('fahrenheit-active');
    }

    announceToScreenReader(`Temperature scale set to ${unit === 'C' ? 'Celsius' : 'Fahrenheit'}`);

    // Re-render cached telemetry immediately without re-fetching
    if (state.weatherData) {
      renderWeatherDashboard(state.weatherData);
    }
  }

  // ==========================================================================
  // 8. EVENT LISTENERS & INITIALIZATION
  // ==========================================================================

  function bindEvents() {
    // Form submission
    elements.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const city = elements.cityInput.value.trim();
      if (!city) {
        elements.cityInput.focus();
        showError('Empty Search', 'Please enter a city name before searching.');
        return;
      }
      fetchWeatherData(city);
    });

    // Input clear button state
    elements.cityInput.addEventListener('input', () => {
      if (elements.cityInput.value.length > 0) {
        elements.clearSearchBtn.classList.remove('hidden');
      } else {
        elements.clearSearchBtn.classList.add('hidden');
      }
    });

    // Clear search button
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.cityInput.value = '';
      elements.clearSearchBtn.classList.add('hidden');
      elements.cityInput.focus();
    });

    // Quick City Preset Chips
    elements.quickChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const city = chip.getAttribute('data-city');
        if (city) {
          elements.cityInput.value = city;
          elements.clearSearchBtn.classList.remove('hidden');
          fetchWeatherData(city);
        }
      });
    });

    // Unit toggle buttons
    elements.unitCelsiusBtn.addEventListener('click', () => setTemperatureUnit('C'));
    elements.unitFahrenheitBtn.addEventListener('click', () => setTemperatureUnit('F'));

    // Refresh telemetry button
    elements.refreshBtn.addEventListener('click', () => {
      const targetCity = state.lastSearchedCity || elements.cityInput.value.trim() || 'Mumbai';
      fetchWeatherData(targetCity);
    });

    // Retry buttons
    elements.errorRetryBtn.addEventListener('click', () => {
      const targetCity = elements.cityInput.value.trim() || state.lastSearchedCity || 'Mumbai';
      fetchWeatherData(targetCity);
    });

    elements.setupRetryBtn.addEventListener('click', () => {
      const targetCity = state.lastSearchedCity || 'Mumbai';
      fetchWeatherData(targetCity);
    });

    // Window connectivity listeners
    window.addEventListener('online', () => {
      announceToScreenReader('Network connection restored.');
      if (elements.errorView && !elements.errorView.classList.contains('hidden')) {
        const targetCity = state.lastSearchedCity || 'Mumbai';
        fetchWeatherData(targetCity);
      }
    });

    window.addEventListener('offline', () => {
      announceToScreenReader('Network offline. Telemetry is currently paused.');
    });
  }

  function init() {
    // 1. Restore saved unit preference
    try {
      const savedUnit = localStorage.getItem(STORAGE_KEYS.UNIT);
      if (savedUnit === 'F' || savedUnit === 'C') {
        state.currentUnit = savedUnit;
      }
    } catch {
      state.currentUnit = 'C';
    }
    setTemperatureUnit(state.currentUnit);

    // 2. Restore last searched city or default to Mumbai
    try {
      const savedCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY);
      if (savedCity && savedCity.trim()) {
        state.lastSearchedCity = savedCity.trim();
      }
    } catch {
      state.lastSearchedCity = 'Mumbai';
    }

    elements.cityInput.value = state.lastSearchedCity;
    if (elements.cityInput.value) {
      elements.clearSearchBtn.classList.remove('hidden');
    }

    // 3. Attach all user interaction handlers
    bindEvents();

    // 4. Initial fetch
    fetchWeatherData(state.lastSearchedCity);
  }

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

