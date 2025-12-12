
export const queryStringProperties = {
    page: { type: 'integer', minimum: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 200 },
    // Accept comma-separated string or array of column names
    sort: {
        anyOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
        ],
    },
    order: { type: 'string', enum: ['asc', 'desc', 'ASC', 'DESC'] },

    // Allowed filters (optional)
    data_year: { anyOf: [{ type: 'integer' }, { type: 'string' }] },
    state_abbr: { type: 'string' },
    county_name: { type: 'string' },
    region_name: { type: 'string' },
} as const;

export const queryStringSchema = {
    type: 'object',
    properties: queryStringProperties,
    additionalProperties: false,
} as const;


export const paramsJsonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
  },
  required: ['id'],
}

