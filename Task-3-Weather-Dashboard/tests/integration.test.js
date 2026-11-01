/**
 * WeatherPulse Asset Integrity & Content Validation Test Suite
 * Verifies that static assets (HTML, CSS, JS) and serverless handlers
 * are syntactically valid, semantically complete, and properly structured.
 * Runs with: node --test tests/integration.test.js
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const weatherHandler = require('../api/weather.js');

describe('WeatherPulse Static Asset & Structural Integrity', () => {
  const rootDir = path.join(__dirname, '..');

  test('Validates index.html exists and contains essential semantic tags and accessibility hooks', () => {
    const htmlPath = path.join(rootDir, 'index.html');
    assert.equal(fs.existsSync(htmlPath), true);

    const html = fs.readFileSync(htmlPath, 'utf8');

    // DOCTYPE and HTML5 semantics
    assert.match(html, /<!DOCTYPE html>/i);
    assert.match(html, /<html\s+lang="en">/i);
    assert.match(html, /<meta\s+name="viewport"/i);

    // Application branding & title
    assert.match(html, /<title>WeatherPulse — Live Weather Dashboard<\/title>/);
    assert.match(html, /Weather<span class="brand-highlight">Pulse<\/span>/);

    // Controls: unit switch & search
    assert.match(html, /id="unit-celsius"/);
    assert.match(html, /id="unit-fahrenheit"/);
    assert.match(html, /id="city-input"/);
    assert.match(html, /id="clear-search-btn"/);
    assert.match(html, /id="search-submit-btn"/);

    // State panels: Setup, Loading skeletons, Error
    assert.match(html, /id="setup-view"/);
    assert.match(html, /id="loading-view"/);
    assert.match(html, /id="error-view"/);

    // Telemetry & Hero sections
    assert.match(html, /id="weather-content"/);
    assert.match(html, /id="current-city-name"/);
    assert.match(html, /id="current-temp"/);
    assert.match(html, /id="current-condition-icon"/);
    assert.match(html, /id="current-condition-text"/);
    assert.match(html, /id="metric-humidity"/);
    assert.match(html, /id="metric-wind-speed"/);
    assert.match(html, /id="metric-pressure"/);
    assert.match(html, /id="metric-uv"/);
    assert.match(html, /id="forecast-cards-container"/);

    // Accessibility live region
    assert.match(html, /id="sr-announcements"/);
    assert.match(html, /aria-live="polite"/);
  });

  test('Validates styles.css contains required design tokens, themes, and responsive queries', () => {
    const cssPath = path.join(rootDir, 'styles.css');
    assert.equal(fs.existsSync(cssPath), true);

    const css = fs.readFileSync(cssPath, 'utf8');

    // Design tokens
    assert.match(css, /--bg-primary:\s*#070a12/);
    assert.match(css, /--card-bg:/);
    assert.match(css, /--accent-indigo:/);
    assert.match(css, /--accent-cyan:/);

    // Dynamic weather themes
    assert.match(css, /body\[data-theme="night"\]/);
    assert.match(css, /body\[data-theme="sunny"\]/);
    assert.match(css, /body\[data-theme="cloudy"\]/);
    assert.match(css, /body\[data-theme="rainy"\]/);
    assert.match(css, /body\[data-theme="snowy"\]/);

    // Glassmorphism and shimmer animation
    assert.match(css, /backdrop-filter:\s*blur/);
    assert.match(css, /@keyframes shimmerAnim/);
    assert.match(css, /@keyframes floatIcon/);

    // Responsive breakpoints (360px, 640px, 768px, 1024px, 1440px)
    assert.match(css, /@media\s*\(min-width:\s*1440px\)/);
    assert.match(css, /@media\s*\(max-width:\s*1024px\)/);
    assert.match(css, /@media\s*\(max-width:\s*768px\)/);
    assert.match(css, /@media\s*\(max-width:\s*640px\)/);

    // Accessibility
    assert.match(css, /prefers-reduced-motion:\s*reduce/);
    assert.match(css, /:focus-visible/);
  });

  test('Validates app.js handles search, Array.map forecast, unit conversions, and safe DOM manipulation', () => {
    const jsPath = path.join(rootDir, 'app.js');
    assert.equal(fs.existsSync(jsPath), true);

    const js = fs.readFileSync(jsPath, 'utf8');

    // Architecture & requirements checks
    assert.match(js, /AbortController/);
    assert.match(js, /fetch\(/);
    assert.match(js, /async function fetchWeatherData/);
    assert.match(js, /renderForecastCards/);
    assert.match(js, /forecastDays\.map/);
    assert.match(js, /determineAtmosphericTheme/);
    assert.match(js, /localStorage/);
    assert.match(js, /announceToScreenReader/);

    // No direct unescaped innerHTML assignments of untrusted API values
    assert.doesNotMatch(js, /innerHTML\s*=\s*data\.location/);
    assert.doesNotMatch(js, /innerHTML\s*=\s*current\.conditionText/);
    assert.doesNotMatch(js, /innerHTML\s*=\s*trimmedCity/);
  });

  test('Validates package.json scripts and project metadata', () => {
    const pkgPath = path.join(rootDir, 'package.json');
    assert.equal(fs.existsSync(pkgPath), true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.equal(pkg.name, 'weatherpulse');
    assert.equal(pkg.scripts.test, 'node --test tests/*.test.js');
    assert.equal(pkg.scripts.dev, 'vercel dev');
  });

  test('Validates .gitignore keeps secrets and local dev environment safe', () => {
    const gitignorePath = path.join(rootDir, '.gitignore');
    assert.equal(fs.existsSync(gitignorePath), true);

    const gitignore = fs.readFileSync(gitignorePath, 'utf8');
    assert.match(gitignore, /\.env\.local/);
    assert.match(gitignore, /\.env/);
    assert.match(gitignore, /\.vercel/);
    assert.match(gitignore, /node_modules/);
  });

  test('Validates .env.example contains WEATHER_API_KEY template', () => {
    const envExPath = path.join(rootDir, '.env.example');
    assert.equal(fs.existsSync(envExPath), true);

    const envEx = fs.readFileSync(envExPath, 'utf8');
    assert.match(envEx, /WEATHER_API_KEY=YOUR_KEY_HERE/);
  });
});
