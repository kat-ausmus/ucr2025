import Fastify, { FastifyInstance } from 'fastify';
import pkg from '../package.json' assert { type: "json" };

import { routes as rootRoute } from './routes/root-route.ts';
import { routes as htRoute } from './routes/ucr/ht-route.ts';

const server: FastifyInstance = Fastify({
  logger: true,
});

// Add version info in the HTTP header for all responses
server.addHook('onSend', async (_request, reply, payload) => {
  try {
    if (pkg?.version) {
      reply.header('X-App-Version', pkg.version);
    }
  } catch (_) {
    // ignore
  }
  return payload;
});

server.register(rootRoute);
server.register(htRoute, { prefix: '/ucr' });

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start().then((_r) => console.log('Fastify Server started'));
