import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema.js';
import { tournaments } from './tournaments.schema.js';

export const tournamentParticipants = pgTable(
  'tournament_participants',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    tournamentId: uuid('tournament_id')
      .notNull()
      .references(() => tournaments.id, {
        onDelete: 'cascade',
      }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
      }),

    joinedAt: timestamp('joined_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('tournament_participants_unique')
      .on(table.tournamentId, table.userId),
  ],
);