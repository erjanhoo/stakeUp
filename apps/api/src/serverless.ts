import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from './create-app.js';
import { loadConfig } from './config.js';

// Reuse one Fastify app across requests handled by the same warm Node function.
let application: ReturnType<typeof buildApp> | undefined;
export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const app = await (application ??= buildApp(loadConfig()));
  await app.ready();
  app.server.emit('request', request, response);
}
