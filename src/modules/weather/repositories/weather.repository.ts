import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { WeatherData, Prisma } from '@prisma/client';

@Injectable()
export class WeatherRepository {
  private readonly logger = new Logger(WeatherRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.WeatherDataCreateInput): Promise<WeatherData> {
    try {
      return await this.prisma.weatherData.create({ data });
    } catch (error) {
      this.logger.error('Failed to create weather data', error);
      throw error;
    }
  }

  async findLatest(city: string): Promise<WeatherData | null> {
    try {
      return await this.prisma.weatherData.findFirst({
        where: { city },
        orderBy: { collectedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Failed to find latest weather for ${city}`, error);
      throw error;
    }
  }

  async findHistory(params: {
    city: string;
    startDate?: Date;
    endDate?: Date;
    skip: number;
    take: number;
  }): Promise<{ data: WeatherData[]; total: number }> {
    try {
      const { city, startDate, endDate, skip, take } = params;

      const where: Prisma.WeatherDataWhereInput = {
        city,
        ...(startDate || endDate
          ? {
              collectedAt: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      };

      const [data, total] = await Promise.all([
        this.prisma.weatherData.findMany({
          where,
          orderBy: { collectedAt: 'desc' },
          skip,
          take,
        }),
        this.prisma.weatherData.count({ where }),
      ]);

      return { data, total };
    } catch (error) {
      this.logger.error('Failed to find weather history', error);
      throw error;
    }
  }

  async deleteOldRecords(beforeDate: Date): Promise<number> {
    try {
      const result = await this.prisma.weatherData.deleteMany({
        where: {
          collectedAt: {
            lt: beforeDate,
          },
        },
      });
      return result.count;
    } catch (error) {
      this.logger.error('Failed to delete old weather records', error);
      throw error;
    }
  }
}
