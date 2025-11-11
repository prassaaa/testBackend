import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { WeatherRepository } from '../repositories/weather.repository';
import {
  GeocodingResponse,
  WeatherForecastResponse,
  WEATHER_CODE_MAP,
} from '../interfaces/open-meteo.interface';
import {
  CurrentWeatherResponseDto,
  WeatherResponseDto,
} from '../dto/weather-response.dto';
import { WeatherHistoryQueryDto } from '../dto/weather-history.dto';
import { PaginatedResponse } from '../../../common/dto/pagination.dto';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly weatherApiBaseUrl: string;
  private readonly geocodingApiBaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly weatherRepository: WeatherRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.weatherApiBaseUrl =
      this.configService.get<string>('app.weatherApiBaseUrl') ||
      'https://api.open-meteo.com/v1';
    this.geocodingApiBaseUrl =
      this.configService.get<string>('app.geocodingApiBaseUrl') ||
      'https://geocoding-api.open-meteo.com/v1';
  }

  async fetchAndSaveWeatherData(city: string): Promise<void> {
    try {
      this.logger.log(`Fetching weather data for ${city}...`);

      // Step 1: Get coordinates from Geocoding API
      const coordinates = await this.getCoordinates(city);
      if (!coordinates) {
        throw new NotFoundException(`City ${city} not found`);
      }

      // Step 2: Get weather forecast
      const weatherData = await this.getWeatherForecast(
        coordinates.latitude,
        coordinates.longitude,
      );

      // Step 3: Save to database
      await this.weatherRepository.create({
        city,
        temperature: weatherData.current.temperature_2m,
        weatherDesc: this.getWeatherDescription(
          weatherData.current.weather_code,
        ),
        collectedAt: new Date(weatherData.current.time),
      });

      this.logger.log(
        `Successfully saved weather data for ${city}: ${weatherData.current.temperature_2m}°C`,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch weather data for ${city}`, error);
      throw error;
    }
  }

  private async getCoordinates(
    city: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const url = `${this.geocodingApiBaseUrl}/search`;
      const response = await firstValueFrom(
        this.httpService.get<GeocodingResponse>(url, {
          params: {
            name: city,
            count: 1,
            language: 'en',
            format: 'json',
          },
        }),
      );

      if (!response.data.results || response.data.results.length === 0) {
        return null;
      }

      const result = response.data.results[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
      };
    } catch (error) {
      this.logger.error(`Failed to get coordinates for ${city}`, error);
      throw error;
    }
  }

  private async getWeatherForecast(
    latitude: number,
    longitude: number,
  ): Promise<WeatherForecastResponse> {
    try {
      const url = `${this.weatherApiBaseUrl}/forecast`;
      const response = await firstValueFrom(
        this.httpService.get<WeatherForecastResponse>(url, {
          params: {
            latitude,
            longitude,
            current: 'temperature_2m,weather_code',
            timezone: 'auto',
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get weather forecast', error);
      throw error;
    }
  }

  private getWeatherDescription(code: number): string {
    return WEATHER_CODE_MAP[code] || 'Unknown';
  }

  async getCurrentWeather(city: string): Promise<CurrentWeatherResponseDto> {
    const cacheKey = `weather:current:${city.toLowerCase()}`;

    // Try to get from cache first
    const cachedData =
      await this.cacheManager.get<CurrentWeatherResponseDto>(cacheKey);

    if (cachedData) {
      this.logger.log(`Cache HIT for ${city}`);
      return { ...cachedData, source: 'cache' };
    }

    this.logger.log(`Cache MISS for ${city}, fetching from database...`);

    // Get from database
    const weatherData = await this.weatherRepository.findLatest(city);

    if (!weatherData) {
      throw new NotFoundException(`No weather data found for ${city}`);
    }

    const response = new CurrentWeatherResponseDto({
      city: weatherData.city,
      temperature: weatherData.temperature,
      weatherDesc: weatherData.weatherDesc,
      collectedAt: weatherData.collectedAt,
      source: 'database',
    });

    // Save to cache
    await this.cacheManager.set(cacheKey, response);
    this.logger.log(`Cached weather data for ${city}`);

    return response;
  }

  async getWeatherHistory(
    city: string,
    query: WeatherHistoryQueryDto,
  ): Promise<PaginatedResponse<WeatherResponseDto>> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const { data, total } = await this.weatherRepository.findHistory({
      city,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      skip,
      take: pageSize,
    });

    return {
      data: data.map((item) => new WeatherResponseDto(item)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
