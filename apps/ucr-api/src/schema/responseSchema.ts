export const response200Properties = {
    data: {
        type: 'array',
        items: {
            type: 'object',
            // We don’t constrain all columns to keep this flexible with DB changes
            additionalProperties: true,
        },
    },
    meta: {
        type: 'object',
        properties: {
            page: {type: 'integer'},
            limit: {type: 'integer'},
            total: {type: 'integer'},
            totalPages: {type: 'integer'},
            sort: {type: 'array', items: {type: 'string'}},
            order: {type: 'string', enum: ['asc', 'desc']},
            filters: {type: 'object', additionalProperties: true},
        },
        required: ['page', 'limit', 'total', 'totalPages', 'sort', 'order', 'filters'],
        additionalProperties: false,
    },
} as const;


export const response200Schema = {
    type: 'object',
    properties: response200Properties,
    required: ['data', 'meta'],
    additionalProperties: false,
} as const;


export const singleItemProperties = {
  type: 'object',
  properties: {
    id: {type: 'string'},
    data_year: {type: 'integer'},
    ori: {type: 'string'},
    pub_agency_name: {type: 'string'},
    pub_agency_unit: {type: 'string'},
    agency_type_name: {type: 'string'},
    state_abbr: {type: 'string'},
    state_name: {type: 'string'},
    county_name: {type: 'string'},
    region_name: {type: 'string'},
    offense_name: {type: 'string'},
    offense_subcat_name: {type: 'string'},
    offense_subcat_id: {type: 'string'},
    actual_count: {type: 'integer'},
    unfounded_count: {type: 'integer'},
    cleared_count: {type: 'integer'},
  },
  additionalProperties: false,
} as const;

export const singleItemResponse200Schema = {
  // This route returns a single record object, not wrapped in `{ data, meta }`.
  // Use the object schema directly rather than nesting it under `properties`.
  ...singleItemProperties,
} as const;
