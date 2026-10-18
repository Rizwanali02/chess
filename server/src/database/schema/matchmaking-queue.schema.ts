
import {
  pgTable,
  timestamp,
  uuid,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tournaments } from './tournaments.schema.js';
import { users } from './users.schema.js';

export const matchmakingQueue = pgTable(
  'matchmaking_queue',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    joinedAt: timestamp('joined_at', {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('matchmaking_queue_tournament_user_unique').on(
      table.tournamentId,
      table.userId,
    ),
  ],
);

export type QueueEntry = typeof matchmakingQueue.$inferSelect;
export type NewQueueEntry = typeof matchmakingQueue.$inferInsert;
