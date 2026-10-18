
import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

import { TournamentsController } from './tournaments.controller.js';
import { TournamentsService } from './tournaments.service.js';

@Module({
  imports: [AuthModule],
  controllers: [TournamentsController],
  providers: [
    TournamentsService,
    RolesGuard,
  ],
})
export class TournamentsModule {}
