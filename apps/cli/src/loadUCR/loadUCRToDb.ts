import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { createReadStream } from 'node:fs';
import { parse } from 'csv-parse';
import knexFactory, { Knex } from 'knex';

// Local knex config duplicated to avoid importing files outside this package (prevents TS6059 in WebStorm)
const knexConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: process.env.PGHOST || '127.0.0.1',
    port: +(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'ucr',
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
  },
};

const transform = (record: Record<string, unknown>) => {
  // Transform 'unfounded_count' sentinels: CSV may use the string 'NULL' to mean SQL NULL
  const localRecord = { ...record };

  const raw = record['unfounded_count'];
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (s.length === 0 || s.toUpperCase() === 'NULL') {
      localRecord['unfounded_count'] = null;
    } else if (/^-?\d+$/.test(s)) {
      // Coerce integer-like strings to numbers
      localRecord['unfounded_count'] = parseInt(s, 10);
    }
    // otherwise leave as-is; DB/type mismatch will surface if unexpected
  }

  const stateCode = (record['state_abbr'] as string).trim();
  if (stateCode === 'NB') {
    localRecord['state_abbr'] = 'NE';
  }

  return localRecord;
};

export class LoadUCRToDb extends Command {
  static paths = [[`load-file`], [`lf`]];

  // Optional CLI argument; if not provided, we fall back to env var UCR_LOAD_FILE
  private fullFilePath = Option.String({ required: false, validator: t.isString() });

  async execute() {
    const fromArg = this.fullFilePath;
    const fromEnv = process.env.UCR_LOAD_FILE;
    const filePath = fromArg || fromEnv;

    if (!filePath) {
      this.context.stderr.write(
        'Error: file path is required. Provide it as an argument or set UCR_LOAD_FILE env var.\n' +
          'Examples:\n' +
          '  - npm run -w ucr-cli start -- load-file /absolute/path/to/file.csv\n' +
          '  - UCR_LOAD_FILE=/absolute/path/to/file.csv npm run -w ucr-cli start -- load-file\n'
      );
      return 1;
    }

    const BATCH_SIZE = 10;
    const tableName = 'human_trafficking';

    // Determine unique key columns for identifying existing records
    const uniqueKeysEnv = process.env.UCR_UNIQUE_KEYS;
    if (!uniqueKeysEnv) {
      this.context.stderr.write(
        'Error: UCR_UNIQUE_KEYS env var is required (comma-separated list of unique key columns).\n' +
          'Example: UCR_UNIQUE_KEYS=incident_id,agency_id,year\n'
      );
      return 1;
    }
    const uniqueKeys = uniqueKeysEnv
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (uniqueKeys.length === 0) {
      this.context.stderr.write('Error: UCR_UNIQUE_KEYS must list at least one column.\n');
      return 1;
    }

    // Create a knex instance from the root knex file config (Postgres)
    const knex = knexFactory(knexConfig as Knex.Config);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let processed = 0;

    const start = Date.now();
    this.context.stdout.write(
      `Streaming CSV and upserting into ${tableName} (batch progress every ${BATCH_SIZE})...\n`
    );

    try {
      // Ensure the connection works up front
      await knex.raw('select 1');

      // We'll run everything in a single transaction for consistency
      await knex.transaction(async (trx) => {
        const stream = createReadStream(filePath!);

        const parser = parse({
          // Interpret the first row as headers and map rows to objects; lowercase header names
          columns: (header: string[]) => header.map((h) => String(h).trim().toLowerCase()),
          bom: true,
          skip_empty_lines: true,
          relax_column_count: true,
          trim: true,
        });

        // Start the pipeline
        stream.pipe(parser);

        for await (const record of parser as AsyncIterable<Record<string, unknown>>) {
          // Normalize fields before DB operations
          const r = transform(record);

          // Validate that record provides all unique keys
          const missing = uniqueKeys.filter((k) => !(k in r));
          if (missing.length) {
            throw new Error(
              `Record is missing required unique key column(s): ${missing.join(', ')}. ` +
                `Ensure your CSV contains these headers: ${uniqueKeys.join(', ')}`
            );
          }

          // Build where clause from unique keys
          const whereClause: Record<string, unknown> = Object.fromEntries(
            uniqueKeys.map((k) => [k, (r as any)[k]])
          );

          // Fetch existing row
          const existing = await trx<Record<string, unknown>>(tableName).where(whereClause).first();

          if (!existing) {
            await trx(tableName).insert(r);
            inserted += 1;
          } else {
            // Compare non-key fields and update only changed columns
            const changed: Record<string, unknown> = {};
            for (const [col, val] of Object.entries(r)) {
              if (uniqueKeys.includes(col)) continue;
              const oldVal = (existing as any)[col];
              const newStr = val == null ? null : String(val);
              const oldStr = oldVal == null ? null : String(oldVal);
              if (newStr !== oldStr) {
                changed[col] = val;
              }
            }

            if (Object.keys(changed).length > 0) {
              await trx(tableName).where(whereClause).update(changed);
              updated += 1;
            } else {
              skipped += 1;
            }
          }

          processed += 1;
          if (processed % BATCH_SIZE === 0) {
            this.context.stdout.write(
              `Progress: processed ${processed} (inserted: ${inserted}, updated: ${updated}, skipped: ${skipped})\n`
            );
          }
        }
      });

      const ms = Date.now() - start;
      this.context.stdout.write(
        `Done. Processed ${processed} rows into ${tableName} in ${ms} ms (inserted: ${inserted}, updated: ${updated}, skipped: ${skipped}).\n`
      );
      return 0;
    } catch (err: any) {
      this.context.stderr.write(`Failed to load CSV: ${err}\n`);
      return 1;
    } finally {
      // Always destroy knex to close pool
      await knex.destroy();
    }
  }
}