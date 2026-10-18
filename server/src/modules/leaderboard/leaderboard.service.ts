
import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import {
  matches,
  tournamentParticipants,
  tournaments,
  users,
} from '../../database/schema/index.js';

@Injectable()
export class LeaderboardService {
  constructor(private readonly database: DatabaseService) {}

  async getTournamentLeaderboard(tournamentId: string) {
    const [tournament] = await this.database.db
      .select({ id: tournaments.id })
      .from(tournaments)
      .where(eq(tournaments.id, tournamentId))
      .limit(1);

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Include every participant, even those with zero points.
    const participants = await this.database.db
      .select({
        userId: tournamentParticipants.userId,
        name: users.name,
      })
      .from(tournamentParticipants)
      .innerJoin(
        users,
        eq(tournamentParticipants.userId, users.id),
      )
      .where(eq(tournamentParticipants.tournamentId, tournamentId));

    const completedMatches = await this.database.db
      .select({
        whitePlayerId: matches.whitePlayerId,
        blackPlayerId: matches.blackPlayerId,
        result: matches.result,
      })
      .from(matches)
      .where(
        and(
          eq(matches.tournamentId, tournamentId),
          eq(matches.status, 'COMPLETED'),
        ),
      );

    const standings = participants.map((participant) => {
      let points = 0;
      let played = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;

      for (const match of completedMatches) {
        const isWhite = match.whitePlayerId === participant.userId;
        const isBlack = match.blackPlayerId === participant.userId;

        if (!isWhite && !isBlack) continue;
        if (!match.result) continue;

        played++;

        if (match.result === 'DRAW') {
          points += 0.5;
          draws++;
        } else {
          const won =
            (match.result === 'WHITE_WIN' && isWhite) ||
            (match.result === 'BLACK_WIN' && isBlack);

          if (won) {
            points += 1;
            wins++;
          } else {
            losses++;
          }
        }
      }

      return {
        userId: participant.userId,
        name: participant.name,
        points,
        played,
        wins,
        draws,
        losses,
      };
    });

    // Highest points first; name gives deterministic ordering on ties.
    standings.sort(
      (a, b) => b.points - a.points || a.name.localeCompare(b.name),
    );

    return standings.map((player, index) => ({
      rank: index + 1,
      ...player,
    }));
  }
}
