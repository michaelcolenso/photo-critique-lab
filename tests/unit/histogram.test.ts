import { it, expect } from 'vitest';
import { analyze } from '../../src/lib/analysis/analyze';
for (const value of [0, 128, 255])
  it(`measures a uniform ${value} image`, () => {
    const data = new Uint8ClampedArray(16 * 4);
    for (let i = 0; i < data.length; i += 4) data.set([value, value, value, 255], i);
    const a = analyze(data, 4, 4);
    expect(a.histogram.luminance[value]).toBe(16);
    expect(a.luminance.mean).toBe(value);
    expect(a.luminance.p50).toBe(value);
    expect(a.sharpness.global).toBe(0);
  });
it('counts every bin of a gradient exactly once', () => {
  const data = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) data.set([i, i, i, 255], i * 4);
  const a = analyze(data, 256, 1);
  expect(a.histogram.luminance).toEqual(Array(256).fill(1));
  expect(a.luminance.mean).toBe(127.5);
  expect(a.luminance.p05).toBe(12);
  expect(a.luminance.p95).toBe(243);
});
