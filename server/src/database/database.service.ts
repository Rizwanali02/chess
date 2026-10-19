import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  readonly db: NodePgDatabase<typeof schema>;


  constructor(config: ConfigService) {
    this.pool = new Pool({
      host: config.getOrThrow<string>('DB_HOST'),
      port: config.get<number>('DB_PORT') ?? 5432,
      database: config.getOrThrow<string>('DB_NAME'),
      user: config.getOrThrow<string>('DB_USER'),
      password: config.getOrThrow<string>('DB_PASSWORD'),
      max: 5,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      ssl: { rejectUnauthorized: false },
    });

    this.db = drizzle(this.pool, { schema });
  }


  async onModuleDestroy() {
    await this.pool.end();
  }

  async ping(): Promise<boolean> {
    const result = await this.pool.query('SELECT 1 AS ok');
    return result.rows[0]?.ok === 1;
  }
}