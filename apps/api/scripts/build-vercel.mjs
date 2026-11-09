import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

await build({
  entryPoints: [fileURLToPath(new URL('../src/serverless.ts', import.meta.url))],
  outfile: fileURLToPath(new URL('../.build/serverless.mjs', import.meta.url)),
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  packages: 'external',
  alias: {
    '@stakeup/contracts': fileURLToPath(
      new URL('../../../packages/contracts/src/index.ts', import.meta.url),
    ),
  },
});
