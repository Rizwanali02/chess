import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MatchesController } from './matches.controller.js';
import { MatchesGateway } from './matches.gateway.js';
import { MatchesService } from './matches.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchesGateway],
  exports: [MatchesService],
})
export class MatchesModule {}