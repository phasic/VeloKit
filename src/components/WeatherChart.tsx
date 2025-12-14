import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeatherSummary, RideConfig } from '../types';
import { storage } from '../utils/storage';

interface WeatherChartProps {
  weather: WeatherSummary;
  config: RideConfig;
}

export function WeatherChart({ weather, config }: WeatherChartProps) {
  const units = storage.getUnits();
  const tempUnit = units === 'imperial' ? '°F' : '°C';
  const windUnit = units === 'imperial' ? 'mph' : 'km/h';

  const chartData = useMemo(() => {
    if (!weather.hourly || weather.hourly.length === 0) {
      return [];
    }

    // Create 10-minute interval data points by interpolating hourly data
    const dataPoints = [];
    const startTime = config.startTime.getTime() / 1000; // Convert to seconds
    const durationSeconds = config.durationHours * 3600;
    const durationMinutes = config.durationHours * 60;
    const intervalMinutes = 10;
    const intervalSeconds = intervalMinutes * 60;
    
    // Determine label interval based on duration to avoid crowding
    // For longer rides, show labels less frequently
    let labelInterval: number;
    if (durationMinutes <= 60) {
      labelInterval = 10; // Show every 10 minutes for rides <= 1 hour
    } else if (durationMinutes <= 120) {
      labelInterval = 20; // Show every 20 minutes for rides <= 2 hours
    } else if (durationMinutes <= 240) {
      labelInterval = 30; // Show every 30 minutes for rides <= 4 hours
    } else {
      labelInterval = 60; // Show every hour for rides > 4 hours
    }
    
    // Find the starting hour index
    let currentHourIndex = 0;
    for (let i = 0; i < weather.hourly.length; i++) {
      if (weather.hourly[i].dt <= startTime) {
        currentHourIndex = i;
      } else {
        break;
      }
    }

    // Generate data points every 10 minutes
    for (let time = startTime; time <= startTime + durationSeconds; time += intervalSeconds) {
      // Find the two hourly data points to interpolate between
      let hour1Index = currentHourIndex;
      let hour2Index = Math.min(currentHourIndex + 1, weather.hourly.length - 1);
      
      // Update current hour index if needed
      while (hour2Index < weather.hourly.length - 1 && weather.hourly[hour2Index].dt < time) {
        currentHourIndex = hour2Index;
        hour1Index = currentHourIndex;
        hour2Index = Math.min(currentHourIndex + 1, weather.hourly.length - 1);
      }

      const hour1 = weather.hourly[hour1Index];
      const hour2 = weather.hourly[hour2Index];
      
      // Calculate interpolation factor (0 = hour1, 1 = hour2)
      const timeDiff = hour2.dt - hour1.dt;
      const factor = timeDiff > 0 ? (time - hour1.dt) / timeDiff : 0;
      
      // Interpolate values
      const feelsLike = hour1.feels_like + (hour2.feels_like - hour1.feels_like) * factor;
      const windSpeed = hour1.wind_speed + (hour2.wind_speed - hour1.wind_speed) * factor;
      const rainChance = hour1.pop + (hour2.pop - hour1.pop) * factor;
      const rainIntensity = (hour1.rain?.['1h'] || 0) + ((hour2.rain?.['1h'] || 0) - (hour1.rain?.['1h'] || 0)) * factor;

      // Format time label: show "Now" for first point, then minutes or hours+minutes
      // Only show label at specified intervals to avoid crowding
      const minutesFromStart = Math.round((time - startTime) / 60);
      const shouldShowLabel = time === startTime || minutesFromStart % labelInterval === 0;
      
      let timeLabel: string;
      if (time === startTime) {
        timeLabel = 'Now';
      } else if (shouldShowLabel) {
        if (minutesFromStart < 60) {
          timeLabel = `${minutesFromStart}min`;
        } else {
          const hours = Math.floor(minutesFromStart / 60);
          const minutes = minutesFromStart % 60;
          timeLabel = minutes > 0 ? `${hours}h${minutes}min` : `${hours}h`;
        }
      } else {
        timeLabel = ''; // Empty label for points that shouldn't be shown
      }

      dataPoints.push({
        time: timeLabel,
        feelsLike: Math.round(feelsLike),
        windSpeed: Math.round(windSpeed),
        rainChance: Math.round(rainChance * 100),
        rainIntensity: Math.round(rainIntensity * 10) / 10,
      });
    }

    return dataPoints;
  }, [weather.hourly, config]);

  if (!weather.hourly || weather.hourly.length === 0) {
    return null;
  }

  return (
    <div className="weather-chart">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--separator-color)" />
          <XAxis 
            dataKey="time" 
            stroke="var(--secondary-color)"
            style={{ fontSize: '10px' }}
            interval="preserveStartEnd"
            angle={-45}
            textAnchor="end"
            height={50}
            tick={{ fill: 'var(--text-color)' }}
          />
          <YAxis 
            yAxisId="left"
            stroke="var(--primary-color)"
            style={{ fontSize: '12px' }}
            width={45}
            label={{ value: `Temp (${tempUnit})`, angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: '11px', textAnchor: 'middle' } }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="var(--secondary-color)"
            style={{ fontSize: '12px' }}
            width={50}
            label={{ value: 'Wind/Rain', angle: 90, position: 'insideRight', offset: 12, style: { fontSize: '11px', textAnchor: 'middle' } }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-color)', 
              border: '1px solid var(--separator-color)',
              borderRadius: '8px',
              color: 'var(--text-color)'
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="feelsLike" 
            stroke="var(--primary-color)" 
            strokeWidth={2}
            name={`Feels like (${tempUnit})`}
            dot={false}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="windSpeed" 
            stroke="#8884d8" 
            strokeWidth={2}
            name={`Wind (${windUnit})`}
            dot={false}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="rainChance" 
            stroke="#82ca9d" 
            strokeWidth={2}
            name="Rain chance (%)"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

