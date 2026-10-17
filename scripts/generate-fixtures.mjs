import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const root = new URL('../tests/fixtures/', import.meta.url);
await mkdir(root, { recursive: true });
const categories = {
  portrait: 4,
  landscape: 3,
  street: 3,
  architecture: 2,
  pets: 2,
  'low-light': 2,
  minimal: 2,
  busy: 2
};
const manifest = [];
for (const [category, count] of Object.entries(categories))
  for (let i = 1; i <= count; i++) {
    const portrait = category === 'portrait',
      width = portrait ? 800 : 1200,
      height = portrait ? 1200 : 800;
    const bg =
      category === 'low-light' ? '#080b10' : category === 'minimal' ? '#d6d2c9' : '#879b9c';
    let shapes = '';
    if (portrait || category === 'pets')
      shapes = `<ellipse cx="${width * 0.52}" cy="${height * 0.44}" rx="${width * 0.18}" ry="${height * 0.19}" fill="#b48263"/><path d="M${width * 0.2} ${height}Q${width * 0.25} ${height * 0.5} ${width * 0.52} ${height * 0.6}Q${width * 0.9} ${height * 0.55} ${width * 0.9} ${height}" fill="#2a464d"/>`;
    else if (category === 'landscape')
      shapes = `<circle cx="900" cy="170" r="75" fill="#f2dda0"/><path d="M0 650L340 260 680 700 990 330 1200 570V800H0" fill="#465e4a"/><path d="M0 760L660 470 1200 740V800H0" fill="#253c38"/>`;
    else if (category !== 'minimal')
      shapes = Array.from(
        { length: category === 'busy' ? 18 : 6 },
        (_, n) =>
          `<rect x="${(n * 137 + i * 30) % 1100}" y="${100 + ((n * 79) % 400)}" width="${65 + n * 7}" height="${150 + ((n * 83) % 350)}" fill="hsl(${(n * 41 + i * 30) % 360},20%,${25 + (n % 4) * 10}%)"/>`
      ).join('');
    else shapes = '<circle cx="720" cy="350" r="80" fill="#3d5144"/>';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${bg}"/>${shapes}</svg>`;
    const file = `${category}-${i}.jpg`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(new URL(file, root).pathname);
    manifest.push({
      file,
      category,
      synthetic: true,
      invariants: {
        must_return_three_crops: true,
        crop_bounds_valid: true,
        wildcard_materially_distinct: true,
        subject_not_accidentally_excluded: true
      }
    });
  }
// Exact pixel fixture: four blocks, no private image content.
const pixels = Buffer.alloc(120 * 80 * 3);
for (let y = 0; y < 80; y++)
  for (let x = 0; x < 120; x++) {
    const color =
      x < 60 ? (y < 40 ? [255, 0, 0] : [0, 0, 255]) : y < 40 ? [0, 255, 0] : [255, 255, 255];
    pixels.set(color, (y * 120 + x) * 3);
  }
await sharp(pixels, { raw: { width: 120, height: 80, channels: 3 } })
  .png()
  .toFile(new URL('blocks.png', root).pathname);
await sharp(pixels, { raw: { width: 120, height: 80, channels: 3 } })
  .webp({ lossless: true })
  .toFile(new URL('blocks.webp', root).pathname);
for (let orientation = 1; orientation <= 8; orientation++)
  await sharp(pixels, { raw: { width: 120, height: 80, channels: 3 } })
    .withMetadata({ orientation })
    .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
    .toFile(new URL(`orientation-${orientation}.jpg`, root).pathname);
await sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#6f8f5f' } })
  .jpeg()
  .toFile(new URL('large.jpg', root).pathname);
await writeFile(
  new URL('manifest.json', root),
  JSON.stringify(
    {
      note: 'Synthetic engineering fixtures, not evidence of photographic judgment quality. A licensed real-photo golden set must be evaluated before a photographer study.',
      images: manifest
    },
    null,
    2
  )
);
console.log(
  `Generated ${manifest.length} synthetic scene fixtures, orientation cases, and pixel fixtures.`
);
