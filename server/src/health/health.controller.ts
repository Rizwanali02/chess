import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  async check() {
    const databaseConnected = await this.database.ping();

    return {
      success: true,
      data: {
        api: 'ok',
        database: databaseConnected ? 'connected' : 'disconnected',
      },
      meta: null,
    };
  }
}