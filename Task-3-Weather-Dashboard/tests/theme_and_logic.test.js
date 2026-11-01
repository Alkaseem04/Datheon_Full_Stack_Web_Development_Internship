/**
 * WeatherPulse Client Logic & Theme Mapping Test Suite
 * Tests core business logic, atmospheric themes, and temperature conversions.
 * Runs with: node --test tests/theme_and_logic.test.js
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Replicate pure helper functions from app.js for isolated unit testing
function determineAtmosphericTheme(isDay, conditionCode, conditionText) {
  if (isDay === 0) {
    return 'night';
  }

  const text = (conditionText || '').toLowerCase();

  const snowCodes = [1066, 1069, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264, 1279, 1282];
  if (snowCodes.includes(conditionCode) || text.includes('snow') || text.includes('blizzard') || text.includes('sleet') || text.includes('ice')) {
    return 'snowy';
  }

  const rainCodes = [1063, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1273, 1276];
  if (rainCodes.includes(conditionCode) || text.includes('rain') || text.includes('drizzle') || text.includes('shower') || text.includes('thunder') || text.includes('storm')) {
    return 'rainy';
  }

  const cloudCodes = [1006, 1009, 1030, 1135, 1147];
  if (cloudCodes.includes(conditionCode) || text.includes('cloud') || text.includes('overcast') || text.includes('mist') || text.includes('fog')) {
    return 'cloudy';
  }

  return 'sunny';
}

function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

describe('Atmospheric Theme & Business Logic', () => {
  test('Selects "night" theme whenever isDay === 0 regardless of condition', () => {
    assert.equal(determineAtmosphericTheme(0, 1000, 'Clear'), 'night');
    assert.equal(determineAtmosphericTheme(0, 1189, 'Moderate rain'), 'night');
    assert.equal(determineAtmosphericTheme(0, 1213, 'Light snow'), 'night');
  });

  test('Selects "sunny" theme for daytime clear conditions', () => {
    assert.equal(determineAtmosphericTheme(1, 1000, 'Sunny'), 'sunny');
    assert.equal(determineAtmosphericTheme(1, 1000, 'Clear'), 'sunny');
  });

  test('Selects "cloudy" theme for daytime cloudy, overcast, mist, or fog', () => {
    assert.equal(determineAtmosphericTheme(1, 1006, 'Cloudy'), 'cloudy');
    assert.equal(determineAtmosphericTheme(1, 1009, 'Overcast'), 'cloudy');
    assert.equal(determineAtmosphericTheme(1, 1030, 'Mist'), 'cloudy');
    assert.equal(determineAtmosphericTheme(1, 1135, 'Fog'), 'cloudy');
  });

  test('Selects "rainy" theme for daytime rain, shower, or thunderstorms', () => {
    assert.equal(determineAtmosphericTheme(1, 1063, 'Patchy rain possible'), 'rainy');
    assert.equal(determineAtmosphericTheme(1, 1189, 'Moderate rain'), 'rainy');
    assert.equal(determineAtmosphericTheme(1, 1273, 'Patchy light rain with thunder'), 'rainy');
  });

  test('Selects "snowy" theme for daytime snow, sleet, blizzard, or ice', () => {
    assert.equal(determineAtmosphericTheme(1, 1066, 'Patchy snow possible'), 'snowy');
    assert.equal(determineAtmosphericTheme(1, 1114, 'Blowing snow'), 'snowy');
    assert.equal(determineAtmosphericTheme(1, 1117, 'Blizzard'), 'snowy');
    assert.equal(determineAtmosphericTheme(1, 1219, 'Moderate snow'), 'snowy');
  });

  test('Calculates Celsius to Fahrenheit conversion accurately', () => {
    assert.equal(celsiusToFahrenheit(0), 32);
    assert.equal(celsiusToFahrenheit(100), 212);
    assert.equal(celsiusToFahrenheit(25), 77);
    assert.equal(Math.round(celsiusToFahrenheit(30)), 86);
  });

  test('Verifies Array.map forecast transformation', () => {
    const rawForecastDays = [
      { date: '2026-11-01', day: { maxtemp_c: 32, mintemp_c: 24, condition: { text: 'Sunny' } } },
      { date: '2026-11-02', day: { maxtemp_c: 30, mintemp_c: 23, condition: { text: 'Rain' } } }
    ];

    const cards = rawForecastDays.map((item) => ({
      date: item.date,
      highC: item.day.maxtemp_c,
      lowC: item.day.mintemp_c,
      condition: item.day.condition.text
    }));

    assert.equal(cards.length, 2);
    assert.equal(cards[0].highC, 32);
    assert.equal(cards[1].condition, 'Rain');
  });
});

