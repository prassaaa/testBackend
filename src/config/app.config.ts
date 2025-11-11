import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  weatherApiBaseUrl:
    process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1',
  geocodingApiBaseUrl:
    process.env.GEOCODING_API_BASE_URL ||
    'https://geocoding-api.open-meteo.com/v1',
  weatherCronSchedule: process.env.WEATHER_CRON_SCHEDULE || '*/15 * * * *',
  cacheTtl: parseInt(process.env.CACHE_TTL || '900', 10),
}));
