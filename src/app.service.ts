import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hari ini semangat, tapi dompet nggak setuju';
  }
}
