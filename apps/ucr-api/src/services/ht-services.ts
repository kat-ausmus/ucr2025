import knexFactory, { Knex } from 'knex';

// Local knex config (mirrors root knexfile.ts). Keeping it here avoids cross-package imports.
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

// Whitelist of columns that can be used for sorting to prevent SQL injection
const SORTABLE_COLUMNS = new Set([
  'data_year',
  'ori',
  'pub_agency_name',
  'state_abbr',
  'state_name',
  'county_name',
  'region_name',
  'offense_name',
  'offense_subcat_name',
  'offense_subcat_id',
  'actual_count',
  'unfounded_count',
  'cleared_count',
  'juvenile_cleared_count',
]);

const FILTERABLE_COLUMNS = new Set([
    'data_year',
    'state_abbr',
    'county_name',
    'region_name',
])

const  transformFilters = (queryParms: Omit<{}, "limit" | "page" | "sort" | "order">, base: knexFactory.Knex.QueryBuilder<any, {
    _base: any;
    _hasSelection: false;
    _keys: string;
    _aliases: {};
    _single: false;
    _intersectProps: {};
    _unionProps: never;
}[]>)=> {
    console.info({queryParms});
    const keys = Object.keys(queryParms);
    const whitelisted = keys.every((key) => FILTERABLE_COLUMNS.has(key))
    if(whitelisted) {
        const keyValuePair = Object.entries(queryParms);
       keyValuePair.forEach( ([key, value]) => {
           if(key == 'data_year') {
               base.where(key, parseInt(value as string))
           } else {
               base.where(key, value as string)
           }
        })

    }
    return base;
}

const table = 'human_trafficking';

export const queryHumanTraffickingData = async (request: any, reply: any) => {
  // Extract and normalize query params
  let { page = 1, limit = 40, sort = ['data_year', 'ori'], order = 'asc', ...rest } =
    request.query || {};

  // Coerce to numbers and clamp
  page = Number.isFinite(+page) && +page > 0 ? Math.floor(+page) : 1;
  limit = Number.isFinite(+limit) && +limit > 0 && +limit <= 200 ? Math.floor(+limit) : 40;

  if (!Array.isArray(sort) || sort.length === 0) {
    sort = ['data_year', 'ori'];
  }

  const ord = order.toLowerCase() === 'desc' ? 'desc' : 'asc';

  const knex = knexFactory(knexConfig);

  try {
    // Base query builder with optional search
    const base = knex(table).select('*');

    transformFilters(rest, base);


    // Total count (clone without limit/offset)
    const countQuery = base.clone().clearSelect().count<{ count: string }[]>({ count: '*' });

    // Sorting with whitelist
    for (const col of sort) {
      if (SORTABLE_COLUMNS.has(col)) {
        base.orderBy(col, ord as any);
      }
    }

    // Fallback in case none of the provided sort columns were allowed
    if ((base as any)._statements.filter((s: any) => s.grouping === 'order').length === 0) {
      base.orderBy('data_year', 'asc').orderBy('ori', 'asc');
    }

    // Pagination
    const offset = (page - 1) * limit;
    base.limit(limit).offset(offset);

    // Execute in parallel
    const [data, countRows] = await Promise.all([base, countQuery]);
    const total = Number(countRows?.[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const result = {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        sort,
        order: ord,
        filters: rest,
      },
    };

    return reply.send(result);
  } catch (err) {
    request.log.error(err, 'Failed to query human trafficking data');
    return reply.code(500).send({ error: 'Internal Server Error' });
  } finally {
    await knex.destroy();
  }
};

export const getHumanTraffickingDataById = async (request: any, reply: any) => {
  const knex = knexFactory(knexConfig);
  try {
    const id = request.params.id;
    const data = await knex(table).where({ id }).first();
    return data ? reply.send(data) : reply.code(404).send({ error: 'Item not found' });
  } catch (err) {
    request.log.error(err, 'Failed to get human trafficking data by ID');
    throw err
  } finally {
    await knex.destroy();
  }
}
