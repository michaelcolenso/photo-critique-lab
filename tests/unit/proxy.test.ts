import { it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { validProxy } from '../../src/lib/server/proxy-validation';
const url = (buffer: Buffer) => `data:image/jpeg;base64,${buffer.toString('base64')}`;
it('accepts stripped proxies and rejects full-size and EXIF-bearing JPEGs', async () => {
  const original = await readFile('tests/fixtures/large.jpg');
  expect(validProxy(url(original))).toBe(false);
  const proxy = await sharp(original).resize({ width: 1600 }).jpeg().toBuffer();
  expect(validProxy(url(proxy))).toBe(true);
  const oriented = await readFile('tests/fixtures/orientation-6.jpg');
  expect(validProxy(url(oriented))).toBe(false);
});
it('rejects corrupt, remote, and non-JPEG payloads', () => {
  for (const input of [
    '',
    'https://example.com/photo.jpg',
    'data:image/png;base64,AAAA',
    'data:image/jpeg;base64,AAAA',
    'data:image/jpeg;base64,/9j/'
  ])
    expect(validProxy(input)).toBe(false);
});
