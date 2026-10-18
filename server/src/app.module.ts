import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnv } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { TournamentsModule } from './modules/tournaments/tournaments.module.js';
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module.js';
import { MatchesModule } from './modules/matches/matches.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    TournamentsModule,
    MatchmakingModule,
    MatchesModule,
    LeaderboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}