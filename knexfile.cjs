// Knex configuration for Postgres (docker-compose defaults)
// Uses environment variables if provided; falls back to docker-compose values.

module.exports = {
  client: 'pg',
  connection: {
    host: process.env.PGHOST || '127.0.0.1',
    port: +(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'ucr',
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './apps/ucr-api/migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
};
