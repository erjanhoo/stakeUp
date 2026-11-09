import { buildApp } from './create-app.js';
import { loadConfig } from './config.js';
const config = loadConfig();
const app = await buildApp(config);
export default app;
await app.listen({
  port: Number(process.env.PORT ?? 3001),
  host: config.mode === 'local' ? '127.0.0.1' : '0.0.0.0',
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => {
    void app.close().then(() => process.exit(0));
  });
