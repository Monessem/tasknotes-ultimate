import { NextRequest, NextResponse } from 'next/server';

const CITIES: Record<string, { lat: number; lon: number; name: string }> = {
  cairo: { lat: 30.0444, lon: 31.2357, name: 'Cairo' },
  riyadh: { lat: 24.7136, lon: 46.6753, name: 'Riyadh' },
  dubai: { lat: 25.2048, lon: 55.2708, name: 'Dubai' },
  jeddah: { lat: 21.4858, lon: 39.1925, name: 'Jeddah' },
  doha: { lat: 25.2854, lon: 51.531, name: 'Doha' },
  kuwait: { lat: 29.3759, lon: 47.9774, name: 'Kuwait' },
  amman: { lat: 31.9539, lon: 35.9106, name: 'Amman' },
  casablanca: { lat: 33.5731, lon: -7.5898, name: 'Casablanca' },
  london: { lat: 51.5074, lon: -0.1278, name: 'London' },
  newyork: { lat: 40.7128, lon: -74.006, name: 'New York' },
  paris: { lat: 48.8566, lon: 2.3522, name: 'Paris' },
  tokyo: { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
  istanbul: { lat: 41.0082, lon: 28.9784, name: 'Istanbul' },
  berlin: { lat: 52.52, lon: 13.405, name: 'Berlin' },
  sydney: { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
  toronto: { lat: 43.6532, lon: -79.3832, name: 'Toronto' },
  mumbai: { lat: 19.076, lon: 72.8777, name: 'Mumbai' },
  beijing: { lat: 39.9042, lon: 116.4074, name: 'Beijing' },
  seoul: { lat: 37.5665, lon: 126.978, name: 'Seoul' },
  singapur: { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
};

// WMO Weather Code mappings
const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: 'Sun' },
  1: { description: 'Mainly clear', icon: 'CloudSun' },
  2: { description: 'Partly cloudy', icon: 'CloudSun' },
  3: { description: 'Overcast', icon: 'Cloud' },
  45: { description: 'Foggy', icon: 'CloudFog' },
  48: { description: 'Rime fog', icon: 'CloudFog' },
  51: { description: 'Light drizzle', icon: 'CloudDrizzle' },
  53: { description: 'Moderate drizzle', icon: 'CloudDrizzle' },
  55: { description: 'Dense drizzle', icon: 'CloudDrizzle' },
  56: { description: 'Freezing drizzle', icon: 'CloudDrizzle' },
  57: { description: 'Dense freezing drizzle', icon: 'CloudDrizzle' },
  61: { description: 'Slight rain', icon: 'CloudRain' },
  63: { description: 'Moderate rain', icon: 'CloudRain' },
  65: { description: 'Heavy rain', icon: 'CloudRain' },
  66: { description: 'Freezing rain', icon: 'CloudRain' },
  67: { description: 'Heavy freezing rain', icon: 'CloudRain' },
  71: { description: 'Slight snowfall', icon: 'Snowflake' },
  73: { description: 'Moderate snowfall', icon: 'Snowflake' },
  75: { description: 'Heavy snowfall', icon: 'Snowflake' },
  77: { description: 'Snow grains', icon: 'Snowflake' },
  80: { description: 'Slight rain showers', icon: 'CloudRain' },
  81: { description: 'Moderate rain showers', icon: 'CloudRain' },
  82: { description: 'Violent rain showers', icon: 'CloudRain' },
  85: { description: 'Slight snow showers', icon: 'Snowflake' },
  86: { description: 'Heavy snow showers', icon: 'Snowflake' },
  95: { description: 'Thunderstorm', icon: 'CloudLightning' },
  96: { description: 'Thunderstorm with hail', icon: 'CloudLightning' },
  99: { description: 'Thunderstorm with heavy hail', icon: 'CloudLightning' },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = (searchParams.get('city') ?? 'cairo').toLowerCase();

    const cityData = CITIES[city];
    if (!cityData) {
      return NextResponse.json(
        { error: `Unknown city: ${city}. Available cities: ${Object.keys(CITIES).join(', ')}` },
        { status: 400 }
      );
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${cityData.lat}&longitude=${cityData.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

    const response = await fetch(url, {
      next: { revalidate: 600 }, // Cache for 10 minutes
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch weather data' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const current = data.current || {};
    const weatherCode = current.weather_code ?? 0;
    const wmo = WMO_CODES[weatherCode] || WMO_CODES[0];

    // Return clean, frontend-friendly format
    return NextResponse.json({
      city: cityData.name,
      temperature: Math.round(current.temperature_2m ?? 0),
      description: wmo.description,
      icon: wmo.icon,
      humidity: current.relative_humidity_2m ?? 0,
      windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
    });
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}

// Export cities list for settings dropdown
export { CITIES };
