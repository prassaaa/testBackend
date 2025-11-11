export class WeatherResponseDto {
  id: number;
  city: string;
  temperature: number;
  weatherDesc: string;
  collectedAt: Date;

  constructor(partial: Partial<WeatherResponseDto>) {
    Object.assign(this, partial);
  }
}

export class CurrentWeatherResponseDto {
  city: string;
  temperature: number;
  weatherDesc: string;
  collectedAt: Date;
  source: 'cache' | 'database';

  constructor(partial: Partial<CurrentWeatherResponseDto>) {
    Object.assign(this, partial);
  }
}
