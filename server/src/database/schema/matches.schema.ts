
import {
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  integer,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments.schema.js';
import { users } from './users.schema.js';

export const matchStatusEnum = pgEnum('match_status', [
  'WAITING',
  'IN_PROGRESS',
  'COMPLETED',
]);

export const matchResultEnum = pgEnum('match_result', [
  'WHITE_WIN',
  'BLACK_WIN',
  'DRAW',
]);

export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),

  tournamentId: uuid('tournament_id')
    .notNull()
    .references(() => tournaments.id, { onDelete: 'cascade' }),

  whitePlayerId: uuid('white_player_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  blackPlayerId: uuid('black_player_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  status: matchStatusEnum('status').notNull().default('WAITING'),

  result: matchResultEnum('result'),

  initialSeconds: integer('initial_seconds').notNull(),
  incrementSeconds: integer('increment_seconds').notNull().default(0),

  pgn: text('pgn'),


  whiteTimeRemainingMs: integer('white_time_remaining_ms'),
  blackTimeRemainingMs: integer('black_time_remaining_ms'),

  lastClockStartedAt: timestamp('last_clock_started_at', {
    withTimezone: true,
  }),


  startedAt: timestamp('started_at', {
    withTimezone: true,
  }),

  completedAt: timestamp('completed_at', {
    withTimezone: true,
  }),

  createdAt: timestamp('created_at', {
    withTimezone: true,
  }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex('matches_tournament_players_unique').on(
    table.tournamentId,
    table.whitePlayerId,
    table.blackPlayerId,
  ),
]);

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
