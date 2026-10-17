import { it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

it('pins twenty decodable, attributed real photographs in the requested categories', async () => {
  const manifest = JSON.parse(await readFile('tests/golden/manifest.json', 'utf8'));
  expect(manifest.images).toHaveLength(20);
  const counts: Record<string, number> = {};
  const hashes = new Set<string>();
  for (const image of manifest.images) {
    counts[image.category] = (counts[image.category] ?? 0) + 1;
    expect(image.author.length).toBeGreaterThan(0);
    expect(image.source).toMatch(/^https:\/\/unsplash\.com\/photos\//);
    expect(image.licenseUrl).toBe('https://unsplash.com/license');
    const bytes = await readFile(`tests/golden/${image.file}`);
    const hash = createHash('sha256').update(bytes).digest('hex');
    expect(hash).toBe(image.sha256);
    hashes.add(hash);
    const decoded = await sharp(bytes).metadata();
    expect(decoded.width).toBe(image.width);
    expect(decoded.height).toBe(image.height);
    expect(Math.max(decoded.width!, decoded.height!)).toBeLessThanOrEqual(1600);
    expect(image.invariants.subject_not_accidentally_excluded).toBe(true);
    expect(image.liveReview).toBe('pending_credentials');
  }
  expect(hashes.size).toBe(20);
  expect(counts).toEqual({
    portrait: 4,
    landscape: 3,
    street: 3,
    architecture: 2,
    pets: 2,
    'low-light': 2,
    minimal: 2,
    busy: 2
  });
});
