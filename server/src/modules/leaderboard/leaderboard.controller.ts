
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service.js';

@Controller('tournaments')
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get(':tournamentId/leaderboard')
  getTournamentLeaderboard(
    @Param('tournamentId', ParseUUIDPipe) tournamentId: string,
  ) {
    return this.leaderboardService.getTournamentLeaderboard(
      tournamentId,
    );
  }
}
