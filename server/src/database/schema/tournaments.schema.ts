import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema.js';

export const tournamentStatusEnum = pgEnum(
  'tournament_status',
  ['DRAFT', 'OPEN', 'ONGOING', 'COMPLETED'],
);

export const tournaments = pgTable('tournaments', {
  id: uuid('id').defaultRandom().primaryKey(),

  name: varchar('name', { length: 150 }).notNull(),

  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  initialSeconds: integer('initial_seconds').notNull(),
  incrementSeconds: integer('increment_seconds')
    .notNull()
    .default(0),

  startsAt: timestamp('starts_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull(),

  status: tournamentStatusEnum('status')
    .notNull()
    .default('DRAFT'),

  createdAt: timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull().defaultNow(),

  updatedAt: timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  }).notNull().defaultNow(),
});