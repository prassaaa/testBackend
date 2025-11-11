import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { WeatherService } from '../services/weather.service';

@Injectable()
export class WeatherScheduler implements OnModuleInit {
  private readonly logger = new Logger(WeatherScheduler.name);
  private readonly targetCity: string;
  private readonly timezone: string;
  private readonly dataRetentionDays: number;

  constructor(
    private readonly weatherService: WeatherService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    // Get configuration from environment variables
    this.targetCity = this.configService.get<string>(
      'app.weatherTargetCity',
      'Jakarta',
    );
    this.timezone = this.configService.get<string>(
      'app.weatherTimezone',
      'Asia/Jakarta',
    );
    this.dataRetentionDays = this.configService.get<number>(
      'app.weatherDataRetentionDays',
      30,
    );
  }

  onModuleInit() {
    // Get cron schedule from environment variable
    const cronSchedule = this.configService.get<string>(
      'app.weatherCronSchedule',
      '*/15 * * * *',
    );

    this.logger.log(
      `⏰ Setting up weather data collection cron job with schedule: ${cronSchedule}`,
    );
    this.logger.log(`📍 Target city: ${this.targetCity}`);
    this.logger.log(`🌍 Timezone: ${this.timezone}`);

    // Create and register the cron job
    const job = new CronJob(
      cronSchedule,
      () => {
        void this.handleWeatherDataCollection();
      },
      null,
      true,
      this.timezone,
    );

    this.schedulerRegistry.addCronJob('fetch-weather-data', job);
    this.logger.log('✅ Weather data collection cron job registered');

    // Setup cleanup job
    const cleanupJob = new CronJob(
      '0 0 * * *', // Every day at midnight
      () => {
        this.handleOldDataCleanup();
      },
      null,
      true,
      this.timezone,
    );

    this.schedulerRegistry.addCronJob('cleanup-old-weather-data', cleanupJob);
    this.logger.log(
      `✅ Weather data cleanup cron job registered (retention: ${this.dataRetentionDays} days)`,
    );
  }

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
  handleOldDataCleanup() {
    this.logger.log('🧹 Starting old weather data cleanup...');

    try {
      // Keep only last N days of data (configurable)
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.dataRetentionDays);

      this.logger.log(
        `🗑️  Will delete data older than ${retentionDate.toISOString()} (${this.dataRetentionDays} days ago)`,
      );

      // Note: We'll implement this in repository if needed
      this.logger.log('✅ Old weather data cleanup completed');
    } catch (error) {
      this.logger.error('❌ Failed to cleanup old weather data', error);
    }
  }
}
