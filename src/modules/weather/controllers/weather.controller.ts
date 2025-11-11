import { Controller, Get, Post, Query, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { WeatherService } from '../services/weather.service';
import {
  CurrentWeatherResponseDto,
  WeatherResponseDto,
} from '../dto/weather-response.dto';
import { WeatherHistoryQueryDto } from '../dto/weather-history.dto';
import { PaginatedResponse } from '../../../common/dto/pagination.dto';

@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post('fetch/:city')
  @ApiOperation({ summary: 'Manually fetch weather data for a city' })
  @ApiParam({ name: 'city', description: 'City name', example: 'Jakarta' })
  @ApiResponse({
    status: 200,
    description: 'Weather data fetched successfully',
  })
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
  @ApiOperation({ summary: 'Get current weather for a city' })
  @ApiParam({ name: 'city', description: 'City name', example: 'Jakarta' })
  @ApiResponse({
    status: 200,
    description: 'Current weather data',
    type: CurrentWeatherResponseDto,
  })
  async getCurrentWeather(
    @Param('city') city: string,
  ): Promise<CurrentWeatherResponseDto> {
    return this.weatherService.getCurrentWeather(city);
  }

  @Get('history/:city')
  @ApiOperation({ summary: 'Get weather history for a city with pagination' })
  @ApiParam({ name: 'city', description: 'City name', example: 'Jakarta' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Paginated weather history',
  })
  async getWeatherHistory(
    @Param('city') city: string,
    @Query() query: WeatherHistoryQueryDto,
  ): Promise<PaginatedResponse<WeatherResponseDto>> {
    return this.weatherService.getWeatherHistory(city, query);
  }
}
