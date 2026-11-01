# WeatherPulse — Live Weather Dashboard

[![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-Vanilla%20HTML5%20%7C%20CSS3%20%7C%20ES6%2B-indigo.svg)](#)
[![Deployment](https://img.shields.io/badge/Platform-Vercel%20Serverless-black.svg)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

A high-precision, responsive meteorological telemetry dashboard built from scratch using pure vanilla web standards (HTML5, CSS3, JavaScript ES6+) and Vercel serverless architecture. WeatherPulse delivers real-time weather observations, a 5-day synoptic forecast, dynamic ambient atmospheric gradients, and accessibility-first controls.

Developed for **Datheon Full Stack Web Development Internship — Task 3**.

---

## Architecture & Security Model

WeatherPulse uses a **zero-leakage serverless proxy architecture** to safeguard external weather provider credentials:

```
[ Browser / Client ]
       │
       ▼  GET /api/weather?city=Tokyo
[ Vercel Serverless Function (api/weather.js) ]
       │  (Reads process.env.WEATHER_API_KEY securely on the server)
       ▼  HTTPS GET https://api.weatherapi.com/v1/forecast.json?key=...&q=Tokyo&days=5
[ WeatherAPI Upstream Gateway ]
       │
       ▼  Raw JSON
[ Vercel Serverless Function (api/weather.js) ]
       │  (Validates, sanitizes, normalizes, and strips sensitive data)
       ▼  Normalized Minimal JSON + Cache-Control Headers
[ Browser / Client ]
       │
       ▼  DOM Updates (Safe textContent & Node Creation — Zero XSS)
[ WeatherPulse Dashboard UI ]
```

### Key Security Safeguards
- **Zero API Key Leakage:** The WeatherAPI secret key is strictly stored in environment variables (`process.env.WEATHER_API_KEY`) and parsed exclusively inside the serverless layer. The browser client never sees or requests the private key.
- **Input Sanitization & Boundary Checks:** City queries are trimmed, limited to 100 characters, validated against control characters, and safely encoded via `encodeURIComponent` before reaching upstream endpoints.
- **XSS Prevention:** All dynamic data (city names, descriptions, metric values) is rendered using `textContent` or direct element construction—never direct `innerHTML` injection of untrusted strings.
- **Race Condition Prevention:** Outgoing client requests leverage the native `AbortController` API to immediately cancel in-flight queries when a user submits a new search.
- **Git Hygiene:** `.env` and `.env.local` files are registered in `.gitignore` to prevent accidental credential leakage in version control.

---

## Features

- **Global City Search:** Instant meteorological telemetry for any global city, capital, or regional station with Enter key and button submit support.
- **Real-Time Telemetry Hero:**
  - Dynamic temperature display with instant Celsius (`°C`) and Fahrenheit (`°F`) conversion.
  - Feels-like temperature index.
  - Daily High / Low temperature extremes.
  - Station local observation time and dynamic Day/Night indicator.
  - High-resolution condition iconography with floating ambient physics.
- **Detailed Metric Cards:**
  - **Relative Humidity:** Percentage readout with visual progress gauge and moisture categorization.
  - **Wind Velocity:** Velocity in km/h or mph, compass direction badge, and Beaufort scale descriptors.
  - **Barometric Pressure:** Atmospheric pressure in hPa or inHg with sea-level barometric trend indicator.
  - **Solar UV & Visibility:** Multi-split card with UV index risk badge (Low / Moderate / High) and atmospheric line-of-sight visibility.
- **5-Day Synoptic Forecast:**
  - 5 daily cards mapped directly from forecast data using JavaScript `Array.map()`.
  - Day label ("Today", "Tomorrow", weekday), formatted date, weather icon, condition text, high/low range, and precipitation probability pill.
- **Dynamic Atmospheric Backgrounds:**
  - Seamless gradient transitions reflecting ambient weather conditions:
    - `Sunny`: Radiant daylight azure and warm solar glow.
    - `Cloudy`: Slate twilight and silver overcast mist.
    - `Rainy`: Deep midnight cyan and stormy atmospheric glow.
    - `Snowy`: Frosted arctic luminescence.
    - `Night`: Deep cosmic obsidian and starlight indigo (triggered automatically via `is_day === 0`).
- **Resilient State Management:**
  - **Loading Skeletons:** Animated shimmering placeholders and spinner during telemetry retrieval.
  - **Setup Guidance View:** Clear setup instructions displayed if the serverless API key is missing.
  - **Graceful Error Handling:** Dedicated error banner with actionable guidance for 404 (Station Not Found), 429 (Rate Limits), empty queries, or network disconnections.
  - **Quick City Chips:** One-click shortcuts for major hubs (Mumbai, London, Tokyo, New York, Dubai, Paris).
  - **Local Persistence:** Preserves unit preference (`°C` / `°F`) and last searched city in `localStorage`.
- **Accessibility & Responsiveness:**
  - High contrast WCAG 2.1 AA compliant color palette.
  - Screen reader live announcements via `aria-live="polite"`.
  - Accessible focus states (`:focus-visible`).
  - Native `prefers-reduced-motion` compliance.
  - Fully responsive from 360px mobile viewports up to 1440px+ ultra-wide displays.

---

## Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Vanilla HTML5 | Semantic document structure, accessibility roles, SVG iconography |
| **Styling** | Vanilla CSS3 | Custom design system, CSS Grid, Flexbox, glassmorphism, animations |
| **Logic** | Vanilla ES6+ | Fetch API, async/await, AbortController, Array.map, event delegation |
| **Serverless API** | Node.js (Vercel) | Secure proxy endpoint at `/api/weather` |
| **Upstream Provider**| WeatherAPI.com | Real-time global observations and 5-day forecasts |
| **Testing** | Node.js Test Runner | Built-in test suite (`node --test tests/*.test.js`) |

---

## Project Structure

```
Task-3-Weather-Dashboard/
├── api/
│   └── weather.js              # Vercel serverless proxy (/api/weather)
├── tests/
│   ├── api.test.js             # Serverless handler validation & error mocks
│   ├── integration.test.js     # Structural and static asset integrity tests
│   └── theme_and_logic.test.js # Atmospheric theme mappings & unit conversions
├── .env.example                # Template for environment configuration
├── .gitignore                  # Git exclusion rules (.env.local, .vercel, etc.)
├── app.js                      # Client application logic & UI renderer
├── index.html                  # Semantic HTML5 dashboard markup
├── package.json                # Project scripts & metadata
├── styles.css                  # Master CSS styles & dynamic themes
└── README.md                   # Documentation & testing matrix
```

---

## Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- [Vercel CLI](https://vercel.com/cli) (installed globally or via `npx vercel`)
- Free API Key from [WeatherAPI.com](https://www.weatherapi.com/signup.aspx)

### Step 1: Clone or Navigate to Directory
```bash
cd Task-3-Weather-Dashboard
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Open `.env.local` and insert your WeatherAPI key:
```env
WEATHER_API_KEY=your_weatherapi_key_here
```

### Step 3: Run with Vercel CLI
To enable the `/api/weather` serverless function locally, run:
```bash
npx vercel dev
```
By default, the server will launch at:
```
http://localhost:3000
```

### Step 4: Run Automated Tests
Execute the automated test suite verifying serverless proxy logic, input validation, error handling, and theme calculation:
```bash
npm test
```

---

## How to Obtain a WeatherAPI Key

1. Visit [WeatherAPI Sign Up](https://www.weatherapi.com/signup.aspx).
2. Enter your email, username, and password (free tier requires no credit card).
3. Verify your email address.
4. Log into the [WeatherAPI Dashboard](https://www.weatherapi.com/my/).
5. Copy your **API Key** from the dashboard.
6. Paste the key into `.env.local` for local execution or into Vercel Project Settings for production.

---

## Deployment to Vercel

### Option 1: Via Vercel CLI
```bash
# Log in to Vercel
npx vercel login

# Link and deploy
npx vercel

# Add the environment variable to your Vercel deployment
npx vercel env add WEATHER_API_KEY
# (Select Production, Preview, and Development when prompted)

# Deploy to production
npx vercel --prod
```

### Option 2: Via GitHub / Vercel Dashboard
1. Push your repository to GitHub (ensure `.env.local` is **not** committed).
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Under **Environment Variables**, add:
   - **Key:** `WEATHER_API_KEY`
   - **Value:** `your_weatherapi_key_here`
5. Click **Deploy**. Vercel will automatically build the static assets and deploy `/api/weather` as a serverless function.

---

## UI / UX Showcase & Screenshots

### Desktop View (1440px)
- Elegant dark navy backdrop (`#070a12`) with frosted glass panels (`backdrop-filter: blur(20px)`).
- Centered search console with quick preset chips for popular metropolitan hubs.
- High-contrast Hero banner featuring live local time, daytime/nighttime status, and temperature extremes.
- Four-column telemetry metric cards with custom animated progress meters and qualitative descriptors.
- Five-day forecast card row featuring high/low thermal ranges and precipitation badges.

### Tablet View (768px)
- Adaptive two-column grid for telemetry metrics.
- Horizontally scrollable 5-day forecast cards with snap-align.
- Fluid fluid typography and touch-optimized controls.

### Mobile View (360px)
- Single-column stacked telemetry metrics designed for thumb-friendly one-handed navigation.
- Full-width search bar and clear button.
- Compact hero typography with legible hierarchy and zero horizontal overflow.

---

## QA Testing Checklist & Manual Test Matrix

| ID | Test Scenario | Steps to Execute | Expected Behavior | Verification Status |
| :--- | :--- | :--- | :--- | :---: |
| **TC-01** | **Initial Page Load (Default City)** | Open dashboard with valid API key configured. | Automatically loads Mumbai telemetry with hero, 4 metric cards, and 5 forecast days. | Passed |
| **TC-02** | **Setup View (Missing Key)** | Remove or leave `WEATHER_API_KEY` unset and load page. | Displays Setup Guide banner with 3-step instructions; no broken/fake weather rendered. | Passed |
| **TC-03** | **Global City Search** | Search for "Tokyo", "London", or "New York". | Skeletons animate, telemetry updates accurately, background gradient shifts to match weather. | Passed |
| **TC-04** | **Empty Search Submission** | Press Enter or click Explore with blank search input. | Form shows friendly error; prevents empty API call. | Passed |
| **TC-05** | **Unknown City (404 Handling)** | Search for "ZzzRandomInvalidCity12345". | Displays accessible error alert: "No meteorological station found for..."; shows Retry button. | Passed |
| **TC-06** | **Temperature Unit Switch (°C / °F)**| Click `°F` or `°C` in the header toggle switch. | Immediately re-calculates Hero temp, feels-like, wind units, pressure units, and forecast cards without network re-fetch. | Passed |
| **TC-07** | **Dynamic Ambient Atmosphere** | Search for clear, rainy, snowy, and night locations. | `data-theme` attribute on `<body>` transitions smoothly between sunny, cloudy, rainy, snowy, and night. | Passed |
| **TC-08** | **Stale Search Abort (Race Condition)** | Rapidly click different quick chips (e.g. Mumbai -> London -> Tokyo). | `AbortController` cancels prior pending requests; only the final clicked city is rendered. | Passed |
| **TC-09** | **Offline Detection** | Disconnect network or toggle Offline in DevTools. | Status changes to offline; screen reader announces network status change. | Passed |
| **TC-10** | **Keyboard & Screen Reader Accessibility** | Navigate using only `Tab`, `Shift+Tab`, and `Enter`. | Focus states clearly highlighted with indigo ring; live region announces telemetry updates. | Passed |
| **TC-11** | **Mobile Responsiveness (360px - 768px)**| Resize browser window to 360px and 768px. | Layout fluidly reflows without horizontal scrollbars, text clipping, or broken cards. | Passed |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

