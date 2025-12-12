import build from './app.ts';
import pkg from '../package.json' assert { type: "json" };
import fastifyCors from '@fastify/cors';

import { routes as rootRoute } from './routes/root-route.ts';
import { routes as htRoute } from './routes/ucr/ht-route.ts';
import { FastifyInstance } from 'fastify';

const server: FastifyInstance = build({
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

// Route does not exists
server.setNotFoundHandler((request, reply) => {
  reply
    .code(404)
    .header('Content-Type', 'application/json')
    .send({
      error: 'Not Found',
      message: `Resource '${request.url}' was not found`,
      statusCode: 404
    })
});

server.register(rootRoute);
server.register(htRoute, { prefix: '/ucr' });
server.register(fastifyCors, {
  // CORS options go here
  origin: '*', // Allow all origins (for development, consider specific origins in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  credentials: true, // Allow sending cookies or authentication tokens
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start().then((_r) => console.log('Fastify Server started'));
