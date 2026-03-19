import { NextResponse } from "next/server"

interface ForecastDay {
  date: string
  day: string
  high: number
  low: number
  condition: string
  conditionText: string
  precipitation: number
}

interface WeatherResult {
  city: string
  temp: number
  feelsLike: number
  condition: string
  conditionText: string
  humidity: number
  wind: string
  precipitation: number
  forecast?: ForecastDay[]
}

// WMO Weather Code → human-readable condition
const WMO_CODES: Record<number, string> = {
  0: "clear sky",
  1: "mainly clear", 2: "partly cloudy", 3: "overcast",
  45: "foggy", 48: "rime fog",
  51: "light drizzle", 53: "moderate drizzle", 55: "dense drizzle",
  61: "slight rain", 63: "moderate rain", 65: "heavy rain",
  71: "slight snow", 73: "moderate snow", 75: "heavy snow",
  80: "slight showers", 81: "moderate showers", 82: "violent showers",
  95: "thunderstorm", 96: "thunderstorm with hail", 99: "severe thunderstorm",
}

// WMO code → simple condition for the weather card
function wmoToCondition(code: number): string {
  if (code <= 3) return "sunny"
  if (code <= 48) return "cloudy"
  if (code <= 65 || (code >= 80 && code <= 82)) return "rainy"
  if (code >= 71 && code <= 75) return "snowy"
  return "cloudy"
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat") ?? "37.7749"
  const lon = searchParams.get("lon") ?? "-122.4194"
  const city = searchParams.get("city") ?? "San Francisco"
  const forecast = searchParams.get("forecast") === "true"

  try {
    // Current weather
    const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code,apparent_temperature&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`
    const currentRes = await fetch(currentUrl)
    const currentData = await currentRes.json()
    const c = currentData.current

    const result: WeatherResult = {
      city,
      temp: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      condition: wmoToCondition(c.weather_code),
      conditionText: WMO_CODES[c.weather_code] ?? "unknown",
      humidity: c.relative_humidity_2m,
      wind: `${c.wind_speed_10m.toFixed(1)} mph`,
      precipitation: c.precipitation,
    }

    // 5-day forecast if requested
    if (forecast) {
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&temperature_unit=fahrenheit&forecast_days=5`
      const forecastRes = await fetch(forecastUrl)
      const forecastData = await forecastRes.json()
      const d = forecastData.daily

      result.forecast = d.time.map((date: string, i: number) => ({
        date,
        day: new Date(date).toLocaleDateString("en-US", { weekday: "short" }),
        high: Math.round(d.temperature_2m_max[i]),
        low: Math.round(d.temperature_2m_min[i]),
        condition: wmoToCondition(d.weather_code[i]),
        conditionText: WMO_CODES[d.weather_code[i]] ?? "unknown",
        precipitation: d.precipitation_sum[i],
      }))
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    )
  }
}
