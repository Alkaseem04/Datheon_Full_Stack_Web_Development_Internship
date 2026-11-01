/**
 * WeatherPulse — Live Weather Dashboard
 * Serverless API Handler: /api/weather
 *
 * Secure proxy to WeatherAPI.com forecast API.
 * Keeps process.env.WEATHER_API_KEY secure on the server.
 * Validates city input, normalizes response data, and prevents secret exposure.
 */

const UPSTREAM_BASE_URL = 'https://api.weatherapi.com/v1/forecast.json';
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Helper to ensure protocol-relative URLs have https: prefix
 */
function normalizeIconUrl(url) {
  if (!url) return '';
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

/**
 * Standardized JSON responder compatible with Vercel serverless and Node http
 */
function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  if (typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    for (const [header, val] of Object.entries(extraHeaders)) {
      res.setHeader(header, val);
    }
  }
  if (typeof res.status === 'function') {
    return res.status(statusCode).send(body);
  }
  res.statusCode = statusCode;
  res.end(body);
}

module.exports = async function handler(req, res) {
  // 1. Enforce GET method only
  if (req.method && req.method !== 'GET') {
    if (typeof res.setHeader === 'function') {
      res.setHeader('Allow', 'GET');
    }
    return sendJson(res, 405, {
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed. Only GET requests are accepted.'
    });
  }

  // 2. Validate environment configuration
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'YOUR_KEY_HERE') {
    return sendJson(res, 503, {
      error: 'CONFIG_MISSING',
      message: 'Weather API key is not configured on the server. Please define WEATHER_API_KEY in your environment (.env.local for local development or Vercel Environment Variables).'
    });
  }

  // 3. Extract and validate city input
  let city = '';
  if (req.query && req.query.city !== undefined) {
    city = String(req.query.city).trim();
  } else if (req.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      city = (parsedUrl.searchParams.get('city') || '').trim();
    } catch {
      city = '';
    }
  }

  if (!city) {
    return sendJson(res, 400, {
      error: 'EMPTY_CITY',
      message: 'City name parameter is required. E.g. /api/weather?city=Mumbai'
    });
  }

  if (city.length > 100) {
    return sendJson(res, 400, {
      error: 'INVALID_CITY',
      message: 'City name must not exceed 100 characters.'
    });
  }

  // Check for control characters or invalid bytes
  if (/[\x00-\x1F\x7F]/.test(city)) {
    return sendJson(res, 400, {
      error: 'INVALID_CITY',
      message: 'City name contains invalid control characters.'
    });
  }

  // 4. Construct upstream URL
  const upstreamUrl = new URL(UPSTREAM_BASE_URL);
  upstreamUrl.searchParams.set('key', apiKey.trim());
  upstreamUrl.searchParams.set('q', city);
  upstreamUrl.searchParams.set('days', '5');
  upstreamUrl.searchParams.set('aqi', 'no');
  upstreamUrl.searchParams.set('alerts', 'no');

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    const responseText = await upstreamResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return sendJson(res, 502, {
        error: 'UPSTREAM_PARSE_ERROR',
        message: 'Received an invalid response format from upstream weather provider.'
      });
    }

    // Handle upstream error structures
    if (!upstreamResponse.ok || data.error) {
      const code = data.error?.code;
      const upstreamMsg = data.error?.message || 'Weather provider error';

      if (code === 1006) {
        return sendJson(res, 404, {
          error: 'CITY_NOT_FOUND',
          message: `No meteorological station found for "${city}". Please verify spelling and try again.`
        });
      }

      if (code === 2006) {
        return sendJson(res, 502, {
          error: 'INVALID_API_KEY',
          message: 'The configured weather service API key is invalid or inactive.'
        });
      }

      if (code === 2007 || code === 2008) {
        return sendJson(res, 429, {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Weather service request quota has been reached. Please retry shortly.'
        });
      }

      return sendJson(res, upstreamResponse.status >= 400 && upstreamResponse.status < 600 ? upstreamResponse.status : 502, {
        error: 'UPSTREAM_ERROR',
        message: upstreamMsg
      });
    }

    // 5. Normalize payload structure for minimal, clean client consumption
    const normalized = {
      location: {
        name: data.location?.name || city,
        region: data.location?.region || '',
        country: data.location?.country || '',
        localtime: data.location?.localtime || '',
        timezone: data.location?.tz_id || 'UTC'
      },
      current: {
        tempC: Math.round((data.current?.temp_c ?? 0) * 10) / 10,
        tempF: Math.round((data.current?.temp_f ?? 0) * 10) / 10,
        feelsLikeC: Math.round((data.current?.feelslike_c ?? 0) * 10) / 10,
        feelsLikeF: Math.round((data.current?.feelslike_f ?? 0) * 10) / 10,
        conditionText: data.current?.condition?.text || 'Clear',
        conditionIcon: normalizeIconUrl(data.current?.condition?.icon),
        conditionCode: data.current?.condition?.code || 1000,
        isDay: data.current?.is_day !== undefined ? Number(data.current.is_day) : 1,
        humidity: Number(data.current?.humidity ?? 0),
        windKph: Math.round(data.current?.wind_kph ?? 0),
        windMph: Math.round(data.current?.wind_mph ?? 0),
        windDir: data.current?.wind_dir || 'N',
        pressureMb: Math.round(data.current?.pressure_mb ?? 1013),
        pressureIn: Number((data.current?.pressure_in ?? 29.92).toFixed(2)),
        uv: Number(data.current?.uv ?? 0),
        visibilityKm: Number(data.current?.vis_km ?? 10)
      },
      forecast: Array.isArray(data.forecast?.forecastday)
        ? data.forecast.forecastday.map((dayItem) => ({
            date: dayItem.date,
            dateEpoch: dayItem.date_epoch,
            maxTempC: Math.round(dayItem.day?.maxtemp_c ?? 0),
            minTempC: Math.round(dayItem.day?.mintemp_c ?? 0),
            maxTempF: Math.round(dayItem.day?.maxtemp_f ?? 0),
            minTempF: Math.round(dayItem.day?.mintemp_f ?? 0),
            avgTempC: Math.round(dayItem.day?.avgtemp_c ?? 0),
            avgTempF: Math.round(dayItem.day?.avgtemp_f ?? 0),
            conditionText: dayItem.day?.condition?.text || 'Clear',
            conditionIcon: normalizeIconUrl(dayItem.day?.condition?.icon),
            conditionCode: dayItem.day?.condition?.code || 1000,
            chanceOfRain: Number(dayItem.day?.daily_chance_of_rain ?? 0),
            chanceOfSnow: Number(dayItem.day?.daily_chance_of_snow ?? 0),
            maxWindKph: Math.round(dayItem.day?.maxwind_kph ?? 0),
            avgHumidity: Number(dayItem.day?.avghumidity ?? 0),
            uv: Number(dayItem.day?.uv ?? 0)
          }))
        : []
    };

    return sendJson(
      res,
      200,
      {
        status: 'success',
        data: normalized
      },
      {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300'
      }
    );
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return sendJson(res, 504, {
        error: 'GATEWAY_TIMEOUT',
        message: 'The upstream weather telemetry server took too long to respond. Please try again.'
      });
    }

    return sendJson(res, 500, {
      error: 'SERVER_ERROR',
      message: 'An unexpected internal error occurred while retrieving meteorological data.'
    });
  }
};

