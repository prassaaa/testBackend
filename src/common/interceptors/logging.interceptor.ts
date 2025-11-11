import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request<any, any, unknown> = context
      .switchToHttp()
      .getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    this.logger.log(`➡️  ${method} ${url} - Request: ${JSON.stringify(body)}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          this.logger.log(`⬅️  ${method} ${url} - Response: ${responseTime}ms`);
        },
        error: (error: Error) => {
          // Explicitly typed 'error' as Error
          const responseTime = Date.now() - now;
          this.logger.error(
            `❌ ${method} ${url} - Error: ${error.message} - ${responseTime}ms`,
          );
        },
      }),
    );
  }
}
