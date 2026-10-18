
import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { Chess } from 'chess.js';
import { eq, or } from 'drizzle-orm';
import { DatabaseService } from '../../database/database.service.js';
import { matches, users } from '../../database/schema/index.js';

@Injectable()
export class MatchesService {
    constructor(private readonly database: DatabaseService) { }

    async getMatch(matchId: string, userId: string) {
        const [match] = await this.database.db
            .select()
            .from(matches)
            .where(eq(matches.id, matchId))
            .limit(1);

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        if (
            match.whitePlayerId !== userId &&
            match.blackPlayerId !== userId
        ) {
            throw new ForbiddenException('You are not a player in this match');
        }

        const game = new Chess();

        if (match.pgn) {
            game.loadPgn(match.pgn);
        }

        return {
            id: match.id,
            tournamentId: match.tournamentId,
            whitePlayerId: match.whitePlayerId,
            blackPlayerId: match.blackPlayerId,
            status: match.status,
            result: match.result,
            fen: game.fen(),
            pgn: game.pgn(),
            turn: game.turn(),
            isCheck: game.isCheck(),
            isCheckmate: game.isCheckmate(),
            isDraw: game.isDraw(),
            whiteTimeRemainingMs: match.whiteTimeRemainingMs,
            blackTimeRemainingMs: match.blackTimeRemainingMs,
            lastClockStartedAt: match.lastClockStartedAt,
            startedAt: match.startedAt,
            completedAt: match.completedAt,
        };
    }


    async submitMove(
        matchId: string,
        userId: string,
        move: {
            from: string;
            to: string;
            promotion?: 'q' | 'r' | 'b' | 'n';
        },
    ) {
        return this.database.db.transaction(async (tx) => {
            const [match] = await tx
                .select()
                .from(matches)
                .where(eq(matches.id, matchId))
                .limit(1)
                .for('update');

            if (!match) {
                throw new NotFoundException('Match not found');
            }

            if (
                match.whitePlayerId !== userId &&
                match.blackPlayerId !== userId
            ) {
                throw new ForbiddenException('You are not a player in this match');
            }

            if (match.status !== 'IN_PROGRESS') {
                throw new ConflictException('Match is not in progress');
            }

            const game = new Chess();

            if (match.pgn) {
                game.loadPgn(match.pgn);
            }

            const isWhite = match.whitePlayerId === userId;
            const whiteToMove = game.turn() === 'w';

            if (whiteToMove !== isWhite) {
                throw new ConflictException('It is not your turn');
            }

            const now = new Date();
            const clockStartedAt = match.lastClockStartedAt ?? match.startedAt;

            if (!clockStartedAt) {
                throw new ConflictException('Match clock has not started');
            }

            const elapsedMs = Math.max(
                0,
                now.getTime() - new Date(clockStartedAt).getTime(),
            );

            let whiteMs = match.whiteTimeRemainingMs;
            let blackMs = match.blackTimeRemainingMs;

            // Fallback for older matches created before clock fields existed.
            whiteMs ??= match.initialSeconds * 1000;
            blackMs ??= match.initialSeconds * 1000;

            const remainingBeforeMove = isWhite ? whiteMs : blackMs;

            // Flag fall: the move is not accepted if the player's clock expired.
            if (elapsedMs >= remainingBeforeMove) {
                const result = isWhite ? 'BLACK_WIN' : 'WHITE_WIN';

                const [finished] = await tx
                    .update(matches)
                    .set({
                        status: 'COMPLETED',
                        result,
                        whiteTimeRemainingMs: isWhite ? 0 : whiteMs,
                        blackTimeRemainingMs: isWhite ? blackMs : 0,
                        lastClockStartedAt: null,
                        completedAt: now,
                    })
                    .where(eq(matches.id, matchId))
                    .returning();

                return {
                    status: 'COMPLETED' as const,
                    reason: 'TIMEOUT' as const,
                    matchId: finished.id,
                    result: finished.result,
                    whiteTimeRemainingMs: isWhite ? 0 : whiteMs,
                    blackTimeRemainingMs: isWhite ? blackMs : 0,
                };
            }

            // The move must be legal before its increment is awarded.
            let appliedMove;

            try {
                appliedMove = game.move({
                    from: move.from,
                    to: move.to,
                    promotion: move.promotion,
                });
            } catch {
                throw new BadRequestException('Illegal chess move');
            }

            if (!appliedMove) {
                throw new BadRequestException('Illegal chess move');
            }

            const moverRemaining = remainingBeforeMove - elapsedMs
                + match.incrementSeconds * 1000;

            if (isWhite) {
                whiteMs = moverRemaining;
            } else {
                blackMs = moverRemaining;
            }

            let result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | null = null;

            if (game.isCheckmate()) {
                result = game.turn() === 'w' ? 'BLACK_WIN' : 'WHITE_WIN';
            } else if (game.isDraw()) {
                result = 'DRAW';
            }

            const [updated] = await tx
                .update(matches)
                .set({
                    pgn: game.pgn(),
                    whiteTimeRemainingMs: whiteMs,
                    blackTimeRemainingMs: blackMs,
                    lastClockStartedAt: result ? null : now,
                    ...(result
                        ? {
                            status: 'COMPLETED' as const,
                            result,
                            completedAt: now,
                        }
                        : {}),
                })
                .where(eq(matches.id, matchId))
                .returning();

            return {
                status: updated.status,
                matchId: updated.id,
                move: appliedMove,
                fen: game.fen(),
                pgn: game.pgn(),
                turn: game.turn(),
                result: updated.result,
                whiteTimeRemainingMs: whiteMs,
                blackTimeRemainingMs: blackMs,
                lastClockStartedAt: updated.lastClockStartedAt,
                isCheck: game.isCheck(),
                isCheckmate: game.isCheckmate(),
                isDraw: game.isDraw(),
            };
        });
    }



    async processExpiredClocks() {
        const activeMatches = await this.database.db
            .select()
            .from(matches)
            .where(eq(matches.status, 'IN_PROGRESS'));

        const completed: Array<{
            matchId: string;
            result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW';
        }> = [];

        for (const candidate of activeMatches) {
            const outcome = await this.database.db.transaction(async (tx) => {
                const [match] = await tx
                    .select()
                    .from(matches)
                    .where(eq(matches.id, candidate.id))
                    .limit(1)
                    .for('update');

                if (
                    !match ||
                    match.status !== 'IN_PROGRESS' ||
                    !match.lastClockStartedAt
                ) {
                    return null;
                }

                const game = new Chess();

                if (match.pgn) {
                    game.loadPgn(match.pgn);
                }

                const now = new Date();
                const elapsedMs = Math.max(
                    0,
                    now.getTime() - match.lastClockStartedAt.getTime(),
                );

                const whiteMs =
                    match.whiteTimeRemainingMs ?? match.initialSeconds * 1000;
                const blackMs =
                    match.blackTimeRemainingMs ?? match.initialSeconds * 1000;

                const whiteToMove = game.turn() === 'w';
                const activeRemaining = whiteToMove ? whiteMs : blackMs;

                if (elapsedMs < activeRemaining) {
                    return null;
                }

                const result = game.isInsufficientMaterial()
                    ? 'DRAW'
                    : whiteToMove
                        ? 'BLACK_WIN'
                        : 'WHITE_WIN';

                await tx
                    .update(matches)
                    .set({
                        status: 'COMPLETED',
                        result,
                        whiteTimeRemainingMs: whiteToMove ? 0 : whiteMs,
                        blackTimeRemainingMs: whiteToMove ? blackMs : 0,
                        lastClockStartedAt: null,
                        completedAt: now,
                    })
                    .where(eq(matches.id, match.id));

                return { matchId: match.id, result } as const;
            });

            if (outcome) completed.push(outcome);
        }

        return completed;
    }

    async resignMatch(matchId: string, userId: string) {
        return this.database.db.transaction(async (tx) => {
            const [match] = await tx
                .select()
                .from(matches)
                .where(eq(matches.id, matchId))
                .limit(1)
                .for('update');

            if (!match) {
                throw new NotFoundException('Match not found');
            }

            if (
                match.whitePlayerId !== userId &&
                match.blackPlayerId !== userId
            ) {
                throw new ForbiddenException(
                    'You are not a player in this match',
                );
            }

            if (match.status !== 'IN_PROGRESS') {
                throw new ConflictException('Match is not in progress');
            }

            const result =
                match.whitePlayerId === userId
                    ? 'BLACK_WIN'
                    : 'WHITE_WIN';

            const now = new Date();

            await tx
                .update(matches)
                .set({
                    status: 'COMPLETED',
                    result,
                    completedAt: now,
                    lastClockStartedAt: null,
                })
                .where(eq(matches.id, matchId));

            return {
                matchId,
                status: 'COMPLETED',
                result,
                reason: 'RESIGNATION',
            };
        });
    }

}
