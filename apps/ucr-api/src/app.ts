import fastify, { FastifyInstance } from 'fastify';

const build = (opts = {}): FastifyInstance => {
  return fastify(opts)
}

export default build;