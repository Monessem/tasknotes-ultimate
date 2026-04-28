import { NextRequest, NextResponse } from 'next/server';

const CITIES: Record<string, { lat: number; lon: number }> = {
  cairo: { lat: 30.0444, lon: 31.2357 },
  riyadh: { lat: 24.7136, lon: 46.6753 },
  dubai: { lat: 25.2048, lon: 55.2708 },
  jeddah: { lat: 21.4858, lon: 39.1925 },
  doha: { lat: 25.2854, lon: 51.531 },
  kuwait: { lat: 29.3759, lon: 47.9774 },
  amman: { lat: 31.9539, lon: 35.9106 },
  casablanca: { lat: 33.5731, lon: -7.5898 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = (searchParams.get('city') ?? 'cairo').toLowerCase();

    const coords = CITIES[city];
    if (!coords) {
      return NextResponse.json(
        { error: `Unknown city: ${city}. Available cities: ${Object.keys(CITIES).join(', ')}` },
        { status: 400 }
      );
    }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

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

    return NextResponse.json({
      city,
      ...data,
    });
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}
