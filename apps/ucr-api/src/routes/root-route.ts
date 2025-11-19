import { FastifyInstance } from 'fastify';
import { helloRoot } from '../services/root-services.ts';

/**
 * A plugin that provide encapsulated routes
 * @param {FastifyInstance} fastify encapsulated fastify instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
export const routes = async (fastify: FastifyInstance, options: object) => {
  fastify.get('/', options, helloRoot);
};
