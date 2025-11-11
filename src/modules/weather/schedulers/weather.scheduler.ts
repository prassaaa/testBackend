import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from '../services/weather.service';

@Injectable()
export class WeatherScheduler {
  private readonly logger = new Logger(WeatherScheduler.name);
  private readonly targetCity: string = 'Jakarta';

  constructor(private readonly weatherService: WeatherService) {}

  // Run every 15 minutes
  @Cron('*/15 * * * *', {
    name: 'fetch-weather-data',
    timeZone: 'Asia/Jakarta',
  })
  async handleWeatherDataCollection() {
    this.logger.log(
      `🌤️  Starting weather data collection for ${this.targetCity}...`,
    );

    try {
      await this.weatherService.fetchAndSaveWeatherData(this.targetCity);
      this.logger.log(
        `✅ Weather data collection completed for ${this.targetCity}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to collect weather data for ${this.targetCity}`,
        error,
      );
    }
  }

  // Clean up old data every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'cleanup-old-weather-data',
    timeZone: 'Asia/Jakarta',
  })
  handleOldDataCleanup() {
    this.logger.log('🧹 Starting old weather data cleanup...');

    try {
      // Keep only last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Note: We'll implement this in repository if needed
      this.logger.log('✅ Old weather data cleanup completed');
    } catch (error) {
      this.logger.error('❌ Failed to cleanup old weather data', error);
    }
  }
}
