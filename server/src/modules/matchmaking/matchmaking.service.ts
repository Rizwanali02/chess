
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, inArray, ne, or, sql } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import {
  matchmakingQueue,
  matches,
  tournamentParticipants,
  tournaments,
  users,
} from '../../database/schema/index.js';

@Injectable()
export class MatchmakingService {
  constructor(private readonly database: DatabaseService) { }

  async joinQueue(userId: string, tournamentId: string) {
    return this.database.db.transaction(async (tx) => {

      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(71420531)`,
      );

      const [student] = await tx
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!student || student.role !== 'STUDENT') {
        throw new BadRequestException(
          'Only students can join matchmaking',
        );
      }

      const [tournament] = await tx
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .limit(1);

      if (!tournament) {
        throw new NotFoundException('Tournament not found');
      }

      if (tournament.status !== 'OPEN') {
        throw new BadRequestException('Tournament is not open');
      }

      const [participant] = await tx
        .select({ id: tournamentParticipants.id })
        .from(tournamentParticipants)
        .where(
          and(
            eq(tournamentParticipants.tournamentId, tournamentId),
            eq(tournamentParticipants.userId, userId),
          ),
        )
        .limit(1);

      if (!participant) {
        throw new BadRequestException(
          'Join the tournament before entering matchmaking',
        );
      }

      const [activeMatch] = await tx
        .select({ id: matches.id })
        .from(matches)
        .where(
          and(
            inArray(matches.status, ['WAITING', 'IN_PROGRESS']),
            or(
              eq(matches.whitePlayerId, userId),
              eq(matches.blackPlayerId, userId),
            ),
          ),
        )
        .limit(1);

      if (activeMatch) {
        throw new ConflictException(
          'You already have a waiting or active match',
        );
      }

      // A student may wait in only one tournament queue at a time.
      const [alreadyQueued] = await tx
        .select({ id: matchmakingQueue.id })
        .from(matchmakingQueue)
        .where(eq(matchmakingQueue.userId, userId))
        .limit(1);

      if (alreadyQueued) {
        throw new ConflictException(
          'You are already in a matchmaking queue',
        );
      }

      const [entry] = await tx
        .insert(matchmakingQueue)
        .values({ tournamentId, userId })
        .returning();

      const [opponent] = await tx
        .select({
          queueId: matchmakingQueue.id,
          userId: matchmakingQueue.userId,
        })
        .from(matchmakingQueue)
        .where(
          and(
            eq(matchmakingQueue.tournamentId, tournamentId),
            ne(matchmakingQueue.userId, userId),
          ),
        )
        .orderBy(asc(matchmakingQueue.joinedAt))
        .limit(1)
        .for('update', { skipLocked: true });

      if (!opponent) {
        return {
          status: 'QUEUED' as const,
          queueId: entry.id,
        };
      }

      const [whitePlayerId, blackPlayerId] =
        Math.random() < 0.5
          ? [userId, opponent.userId]
          : [opponent.userId, userId];

      const [match] = await tx
        .insert(matches)
        .values({
          tournamentId,
          whitePlayerId,
          blackPlayerId,
          initialSeconds: tournament.initialSeconds,
          incrementSeconds: tournament.incrementSeconds,
          whiteTimeRemainingMs: tournament.initialSeconds * 1000,
          blackTimeRemainingMs: tournament.initialSeconds * 1000,
          lastClockStartedAt: new Date(),
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        })
        .returning();

      await tx
        .delete(matchmakingQueue)
        .where(
          inArray(matchmakingQueue.id, [
            entry.id,
            opponent.queueId,
          ]),
        );

      return {
        status: 'MATCHED' as const,
        match,
      };
    });
  }

  async leaveQueue(userId: string, tournamentId: string) {
    return this.database.db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(71420531)`,
      );

      const deleted = await tx
        .delete(matchmakingQueue)
        .where(
          and(
            eq(matchmakingQueue.userId, userId),
            eq(matchmakingQueue.tournamentId, tournamentId),
          ),
        )
        .returning({ id: matchmakingQueue.id });

      if (deleted.length === 0) {
        throw new NotFoundException(
          'You are not in this tournament queue',
        );
      }

      return { status: 'LEFT_QUEUE' as const };
    });
  }
}
