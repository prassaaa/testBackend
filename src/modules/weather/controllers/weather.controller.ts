import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import { WeatherService } from '../services/weather.service';
import {
  CurrentWeatherResponseDto,
  WeatherResponseDto,
} from '../dto/weather-response.dto';
import { WeatherHistoryQueryDto } from '../dto/weather-history.dto';
import { PaginatedResponse } from '../../../common/dto/pagination.dto';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post('fetch/:city')
  async fetchWeatherData(@Param('city') city: string): Promise<{
    message: string;
    city: string;
  }> {
    await this.weatherService.fetchAndSaveWeatherData(city);
    return {
      message: 'Weather data fetched and saved successfully',
      city,
    };
  }

  @Get('current/:city')
  async getCurrentWeather(
    @Param('city') city: string,
  ): Promise<CurrentWeatherResponseDto> {
    return this.weatherService.getCurrentWeather(city);
  }

  @Get('history/:city')
  async getWeatherHistory(
    @Param('city') city: string,
    @Query() query: WeatherHistoryQueryDto,
  ): Promise<PaginatedResponse<WeatherResponseDto>> {
    return this.weatherService.getWeatherHistory(city, query);
  }
}
