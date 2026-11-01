/**
 * WeatherPulse API Test Suite
 * Tests for /api/weather serverless handler
 * Runs using Node.js built-in test runner: node --test tests/api.test.js
 */

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/weather.js');

/**
 * Mock HTTP response helper for testing Vercel serverless handlers
 */
function createMockResponse() {
  const headers = {};
  return {
    statusCode: 200,
    headers,
    body: null,
    setHeader(key, val) {
      headers[key.toLowerCase()] = val;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    end(data) {
      this.body = data;
      return this;
    }
  };
}

describe('WeatherPulse Serverless API (/api/weather)', () => {
  const originalEnvKey = process.env.WEATHER_API_KEY;

  afterEach(() => {
    process.env.WEATHER_API_KEY = originalEnvKey;
  });

  test('Rejects non-GET HTTP methods with 405 Method Not Allowed', async () => {
    const req = { method: 'POST', query: { city: 'Mumbai' } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 405);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'METHOD_NOT_ALLOWED');
    assert.equal(res.headers['allow'], 'GET');
  });

  test('Returns 503 CONFIG_MISSING when WEATHER_API_KEY is not configured', async () => {
    delete process.env.WEATHER_API_KEY;
    const req = { method: 'GET', query: { city: 'Mumbai' } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 503);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'CONFIG_MISSING');
  });

  test('Returns 503 CONFIG_MISSING when WEATHER_API_KEY is placeholder "YOUR_KEY_HERE"', async () => {
    process.env.WEATHER_API_KEY = 'YOUR_KEY_HERE';
    const req = { method: 'GET', query: { city: 'Mumbai' } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 503);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'CONFIG_MISSING');
  });

  test('Returns 400 EMPTY_CITY when city query parameter is empty', async () => {
    process.env.WEATHER_API_KEY = 'test_key_abc123';
    const req = { method: 'GET', query: { city: '   ' } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'EMPTY_CITY');
  });

  test('Returns 400 INVALID_CITY when city exceeds 100 characters', async () => {
    process.env.WEATHER_API_KEY = 'test_key_abc123';
    const req = { method: 'GET', query: { city: 'A'.repeat(101) } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'INVALID_CITY');
  });

  test('Returns 400 INVALID_CITY when city contains control characters', async () => {
    process.env.WEATHER_API_KEY = 'test_key_abc123';
    const req = { method: 'GET', query: { city: 'Mumbai\x00Injected' } };
    const res = createMockResponse();

    await handler(req, res);

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.equal(body.error, 'INVALID_CITY');
  });

  test('Handles mock upstream 1006 (City Not Found) with 404', async () => {
    process.env.WEATHER_API_KEY = 'test_key_abc123';
    const originalFetch = global.fetch;

    global.fetch = async () => ({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({
        error: { code: 1006, message: 'No matching location found.' }
      })
    });

    try {
      const req = { method: 'GET', query: { city: 'NonExistentCityXYZ987' } };
      const res = createMockResponse();

      await handler(req, res);

      assert.equal(res.statusCode, 404);
      const body = JSON.parse(res.body);
      assert.equal(body.error, 'CITY_NOT_FOUND');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('Handles mock upstream 2007 (Rate Limit) with 429', async () => {
    process.env.WEATHER_API_KEY = 'test_key_abc123';
    const originalFetch = global.fetch;

    global.fetch = async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({
        error: { code: 2007, message: 'API key quota exceeded.' }
      })
    });

    try {
      const req = { method: 'GET', query: { city: 'London' } };
      const res = createMockResponse();

      await handler(req, res);

      assert.equal(res.statusCode, 429);
      const body = JSON.parse(res.body);
      assert.equal(body.error, 'RATE_LIMIT_EXCEEDED');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('Normalizes successful upstream weather and 5-day forecast with https icons', async () => {
    process.env.WEATHER_API_KEY = 'valid_test_key_123';
    const originalFetch = global.fetch;

    const mockWeatherApiData = {
      location: {
        name: 'Mumbai',
        region: 'Maharashtra',
        country: 'India',
        localtime: '2026-10-31 21:00',
        tz_id: 'Asia/Kolkata'
      },
      current: {
        temp_c: 29.5,
        temp_f: 85.1,
        feelslike_c: 33.2,
        feelslike_f: 91.8,
        condition: {
          text: 'Clear',
          icon: '//cdn.weatherapi.com/weather/64x64/night/113.png',
          code: 1000
        },
        is_day: 0,
        humidity: 74,
        wind_kph: 11.2,
        wind_mph: 7.0,
        wind_dir: 'NW',
        pressure_mb: 1012.0,
        pressure_in: 29.88,
        uv: 0,
        vis_km: 10
      },
      forecast: {
        forecastday: [
          {
            date: '2026-10-31',
            date_epoch: 1793404800,
            day: {
              maxtemp_c: 34.0,
              mintemp_c: 25.0,
              maxtemp_f: 93.2,
              mintemp_f: 77.0,
              avgtemp_c: 29.5,
              avgtemp_f: 85.1,
              condition: {
                text: 'Sunny',
                icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
                code: 1000
              },
              daily_chance_of_rain: 0,
              daily_chance_of_snow: 0,
              maxwind_kph: 15.0,
              avghumidity: 70,
              uv: 8.0
            }
          },
          {
            date: '2026-11-01',
            date_epoch: 1793491200,
            day: {
              maxtemp_c: 33.0,
              mintemp_c: 24.5,
              maxtemp_f: 91.4,
              mintemp_f: 76.1,
              avgtemp_c: 28.5,
              avgtemp_f: 83.3,
              condition: {
                text: 'Partly cloudy',
                icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
                code: 1003
              },
              daily_chance_of_rain: 10,
              daily_chance_of_snow: 0,
              maxwind_kph: 12.0,
              avghumidity: 68,
              uv: 7.0
            }
          }
        ]
      }
    };

    global.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockWeatherApiData)
    });

    try {
      const req = { method: 'GET', query: { city: 'Mumbai' } };
      const res = createMockResponse();

      await handler(req, res);

      assert.equal(res.statusCode, 200);
      const parsed = JSON.parse(res.body);
      assert.equal(parsed.status, 'success');

      // Check normalized location
      assert.equal(parsed.data.location.name, 'Mumbai');
      assert.equal(parsed.data.location.country, 'India');

      // Check normalized current telemetry
      assert.equal(parsed.data.current.tempC, 29.5);
      assert.equal(parsed.data.current.isDay, 0);
      assert.equal(parsed.data.current.conditionIcon.startsWith('https://'), true);
      assert.equal(parsed.data.current.humidity, 74);
      assert.equal(parsed.data.current.windKph, 11);
      assert.equal(parsed.data.current.pressureMb, 1012);

      // Check normalized forecast days
      assert.equal(parsed.data.forecast.length, 2);
      assert.equal(parsed.data.forecast[0].maxTempC, 34);
      assert.equal(parsed.data.forecast[0].minTempC, 25);
      assert.equal(parsed.data.forecast[0].conditionIcon.startsWith('https://'), true);

      // Check Cache-Control headers
      assert.equal(res.headers['cache-control'], 'public, s-maxage=120, stale-while-revalidate=300');
      assert.equal(res.headers['x-content-type-options'], 'nosniff');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

