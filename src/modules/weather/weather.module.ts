import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherController } from './controllers/weather.controller';
import { WeatherService } from './services/weather.service';
import { WeatherRepository } from './repositories/weather.repository';
import { WeatherScheduler } from './schedulers/weather.scheduler';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherRepository, WeatherScheduler],
  exports: [WeatherService],
})
export class WeatherModule {}
