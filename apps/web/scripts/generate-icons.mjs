import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const destination = new URL('../public/icons/', import.meta.url);
await mkdir(destination, { recursive: true });
const svg = (maskable) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="${maskable ? 0 : 96}" fill="#ff5a1f"/><path d="m23 6-14 17h10l-2 11 14-18H21z" transform="translate(56 56) scale(10)" fill="none" stroke="#111317" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
await writeFile(new URL('icon.svg', destination), svg(false));
for (const size of [192, 512])
  await sharp(Buffer.from(svg(false)))
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`icon-${size}.png`, destination)));
await sharp(Buffer.from(svg(true)))
  .png()
  .toFile(fileURLToPath(new URL('maskable-512.png', destination)));
await sharp(Buffer.from(svg(true)))
  .resize(180, 180)
  .png()
  .toFile(fileURLToPath(new URL('apple-touch-icon.png', destination)));
