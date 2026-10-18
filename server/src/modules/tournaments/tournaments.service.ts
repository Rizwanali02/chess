import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';

import { DatabaseService } from '../../database/database.service.js';
import { users } from '../../database/schema/users.schema.js';
import { tournaments } from '../../database/schema/tournaments.schema.js';
import { tournamentParticipants } from '../../database/schema/participants.schema.js';

import { CreateTournamentDto } from './dto/create-tournament.dto.js';
import { UpdateTournamentDto } from './dto/update-tournament.dto.js';
import { ListTournamentsDto } from './dto/list-tournaments.dto.js';

@Injectable()
export class TournamentsService {
  constructor(private readonly database: DatabaseService) {}

  async create(dto: CreateTournamentDto, coachId: string) {
    const [tournament] = await this.database.db
      .insert(tournaments)
      .values({
        name: dto.name.trim(),
        createdBy: coachId,
        initialSeconds: dto.initialSeconds,
        incrementSeconds: dto.incrementSeconds,
        startsAt: new Date(dto.startsAt),
        status: 'DRAFT',
      })
      .returning();

    return tournament;
  }

  async findAll(query: ListTournamentsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const filter = query.status
      ? eq(tournaments.status, query.status)
      : undefined;

    const rows = await this.database.db
      .select()
      .from(tournaments)
      .where(filter)
      .orderBy(desc(tournaments.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await this.database.db
      .select({ total: count() })
      .from(tournaments)
      .where(filter);

    const total = Number(totalResult.total);

    return {
      items: rows,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const [tournament] = await this.database.db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id))
      .limit(1);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const [participantCount] = await this.database.db
      .select({ total: count() })
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, id));

    return {
      ...tournament,
      participantCount: Number(participantCount.total),
    };
  }

  async update(
    id: string,
    dto: UpdateTournamentDto,
    coachId: string,
  ) {
    const existing = await this.findOne(id);

    if (existing.createdBy !== coachId) {
      throw new ForbiddenException(
        'You can only manage your own tournaments',
      );
    }

    if (existing.status === 'COMPLETED') {
      throw new ConflictException(
        'Completed tournaments cannot be modified',
      );
    }

    if (
      dto.status === 'DRAFT' &&
      existing.status !== 'DRAFT'
    ) {
      throw new ConflictException('Invalid tournament status transition');
    }

    if (
      dto.status === 'ONGOING' &&
      existing.status !== 'OPEN' &&
      existing.status !== 'ONGOING'
    ) {
      throw new ConflictException('Tournament must be open before starting');
    }

    if (
      dto.status === 'COMPLETED' &&
      existing.status !== 'ONGOING'
    ) {
      throw new ConflictException('Only ongoing tournaments can be completed');
    }

    const [updated] = await this.database.db
      .update(tournaments)
      .set({
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.initialSeconds !== undefined && {
          initialSeconds: dto.initialSeconds,
        }),
        ...(dto.incrementSeconds !== undefined && {
          incrementSeconds: dto.incrementSeconds,
        }),
        ...(dto.startsAt !== undefined && {
          startsAt: new Date(dto.startsAt),
        }),
        ...(dto.status !== undefined && { status: dto.status }),
        updatedAt: new Date(),
      })
      .where(eq(tournaments.id, id))
      .returning();

    return updated;
  }

  async remove(id: string, coachId: string) {
    const existing = await this.findOne(id);

    if (existing.createdBy !== coachId) {
      throw new ForbiddenException(
        'You can only manage your own tournaments',
      );
    }

    if (
      existing.status === 'ONGOING' ||
      existing.status === 'COMPLETED'
    ) {
      throw new ConflictException(
        'Ongoing or completed tournaments cannot be deleted',
      );
    }

    await this.database.db
      .delete(tournaments)
      .where(eq(tournaments.id, id));

    return;
  }

  async join(tournamentId: string, studentId: string) {
    const tournament = await this.findOne(tournamentId);

    if (tournament.status !== 'OPEN') {
      throw new ConflictException(
        'Tournament is not accepting participants',
      );
    }

    const [student] = await this.database.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student || student.role !== 'STUDENT') {
      throw new ForbiddenException('Only students can join tournaments');
    }

    try {
      const [participant] = await this.database.db
        .insert(tournamentParticipants)
        .values({
          tournamentId,
          userId: studentId,
        })
        .returning();

      return participant;
    } catch (error: unknown) {
      const pgError = error as { code?: string };

      if (pgError.code === '23505') {
        throw new ConflictException(
          'You have already joined this tournament',
        );
      }

      throw error;
    }
  }

  async participants(tournamentId: string) {
    await this.findOne(tournamentId);

    return this.database.db
      .select({
        id: users.id,
        name: users.name,
        joinedAt: tournamentParticipants.joinedAt,
      })
      .from(tournamentParticipants)
      .innerJoin(
        users,
        eq(tournamentParticipants.userId, users.id),
      )
      .where(
        eq(tournamentParticipants.tournamentId, tournamentId),
      )
      .orderBy(tournamentParticipants.joinedAt);
  }
}