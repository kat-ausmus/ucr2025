import { FastifyInstance } from 'fastify';
import { queryHumanTraffickingData } from '../../services/ht-services.ts';
import { queryStringSchema } from '../../schema/requestSchema.ts';
import { response200Schema } from '../../schema/responseSchema.ts';

/**
 * A plugin that provide encapsulated routes
 * @param {FastifyInstance} fastify encapsulated fastify instance
 * @param {Object} _options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
export const routes = async (fastify: FastifyInstance, _options: object) => {

  fastify.get('/human_trafficking', {
    schema: {
      description: 'Query UCR Human Trafficking data with pagination, sorting, and optional filters',
      tags: ['ucr', 'human_trafficking'],
      querystring: queryStringSchema,
      response: {
        200: response200Schema,
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
          required: ['error'],
        },
      },
    },
    handler: queryHumanTraffickingData,
  });
};
