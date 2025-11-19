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
