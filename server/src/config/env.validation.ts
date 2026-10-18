export function validateEnv(
  config: Record<string, unknown>,
) {
  const databaseUrl = config.DATABASE_URL;
  const jwtSecret = config.JWT_SECRET;
  const port = config.PORT;

  if (
    typeof databaseUrl !== 'string' ||
    !databaseUrl.startsWith('postgresql://')
  ) {
    throw new Error('DATABASE_URL must be a PostgreSQL URL');
  }

  if (
    typeof jwtSecret !== 'string' ||
    jwtSecret.length < 10
  ) {
    throw new Error('JWT_SECRET must be at least 10 characters');
  }

  if (
    port !== undefined &&
    (!Number.isInteger(Number(port)) ||
      Number(port) < 1 ||
      Number(port) > 65535)
  ) {
    throw new Error('PORT must be a valid port number');
  }

  return config;
}