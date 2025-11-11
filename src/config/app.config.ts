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
  weatherTargetCity: process.env.WEATHER_TARGET_CITY || 'Jakarta',
  weatherTimezone: process.env.WEATHER_TIMEZONE || 'Asia/Jakarta',
  weatherDataRetentionDays: parseInt(
    process.env.WEATHER_DATA_RETENTION_DAYS || '30',
    10,
  ),
  cacheTtl: parseInt(process.env.CACHE_TTL || '900', 10),
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
}));
