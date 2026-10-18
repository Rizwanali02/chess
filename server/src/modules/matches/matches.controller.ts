
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { SubmitMoveDto } from './dto/submit-move.dto.js';
import { MatchesService } from './matches.service.js';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) { }

  @Get(':matchId')
  getMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matchesService.getMatch(matchId, user.id);
  }

  @Post(':matchId/moves')
  submitMove(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SubmitMoveDto,
  ) {
    return this.matchesService.submitMove(matchId, user.id, body);
  }


  @Post(':matchId/resign')
  @UseGuards(JwtAuthGuard)
  resignMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matchesService.resignMatch(matchId, user.id);
  }

}
