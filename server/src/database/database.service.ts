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
    const connectionString =
      config.getOrThrow<string>('DATABASE_URL');

    this.pool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
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