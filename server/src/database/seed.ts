import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from './schema/index.js';


async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is missing');
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool);

  const seedUsers = [
    {
      name: 'Coach One',
      email: 'coach@example.com',
      password: 'Coach@12345',
      role: 'COACH' as const,
    },
    ...Array.from({ length: 4 }, (_, index) => ({
      name: `Student ${index + 1}`,
      email: `student${index + 1}@example.com`,
      password: `Student${index + 1}@123`,
      role: 'STUDENT' as const,
    })),
  ];

  try {
    for (const seedUser of seedUsers) {
      const email = seedUser.email.toLowerCase();

      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        console.log(`Skipping existing user: ${email}`);
        continue;
      }

      const passwordHash = await bcrypt.hash(
        seedUser.password,
        12,
      );

      await db.insert(users).values({
        name: seedUser.name,
        email,
        passwordHash,
        role: seedUser.role,
      });

      console.log(`Created: ${email}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Seed failed:', error);
  process.exitCode = 1;
});