import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Note: Default values are set here but can be overridden by ConfigService
// The @Max decorator uses a hardcoded value, but the actual max is enforced in the service layer
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // This is a validation max, actual default comes from config
  pageSize?: number = 10; // Default, can be overridden by config
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
