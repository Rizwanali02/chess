import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

import { TournamentsService } from './tournaments.service.js';
import { CreateTournamentDto } from './dto/create-tournament.dto.js';
import { UpdateTournamentDto } from './dto/update-tournament.dto.js';
import { ListTournamentsDto } from './dto/list-tournaments.dto.js';

@Controller('tournaments')
export class TournamentsController {
  constructor(
    private readonly tournamentsService: TournamentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH')
  async create(
    @Body() dto: CreateTournamentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      success: true,
      data: await this.tournamentsService.create(dto, user.id),
      meta: null,
    };
  }

  @Get()
  async findAll(@Query() query: ListTournamentsDto) {
    return {
      success: true,
      data: await this.tournamentsService.findAll(query),
      meta: null,
    };
  }

  @Get(':tournamentId')
  async findOne(
    @Param('tournamentId', new ParseUUIDPipe()) id: string,
  ) {
    return {
      success: true,
      data: await this.tournamentsService.findOne(id),
      meta: null,
    };
  }

  @Patch(':tournamentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH')
  async update(
    @Param('tournamentId', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateTournamentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      success: true,
      data: await this.tournamentsService.update(
        id,
        dto,
        user.id,
      ),
      meta: null,
    };
  }

  @Delete(':tournamentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('COACH')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('tournamentId', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.tournamentsService.remove(id, user.id);
  }

  @Post(':tournamentId/join')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  @HttpCode(HttpStatus.CREATED)
  async join(
    @Param('tournamentId', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return {
      success: true,
      data: await this.tournamentsService.join(id, user.id),
      meta: null,
    };
  }

  @Get(':tournamentId/participants')
  @UseGuards(JwtAuthGuard)
  async participants(
    @Param('tournamentId', new ParseUUIDPipe()) id: string,
  ) {
    return {
      success: true,
      data: await this.tournamentsService.participants(id),
      meta: null,
    };
  }
}