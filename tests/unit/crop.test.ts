import { describe, it, expect } from 'vitest';
import { pixelRect, clampRect, fitAspect, validRect } from '../../src/lib/image/crop';
describe('literal crop geometry', () => {
  it('keeps rounded subpixel crops within even a one-pixel source', () => {
    expect(pixelRect({ x: 0.8, y: 0.8, width: 0.2, height: 0.2 }, 1, 1)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1
    });
  });
  it('converts normalized coordinates and export dimensions', () =>
    expect(pixelRect({ x: 0.2, y: 0.1, width: 0.6, height: 0.8 }, 1200, 800)).toEqual({
      x: 240,
      y: 80,
      width: 720,
      height: 640
    }));
  it('rounds endpoints consistently without exceeding the source', () =>
    expect(pixelRect({ x: 0.333, y: 0, width: 0.667, height: 1 }, 101, 99)).toEqual({
      x: 34,
      y: 0,
      width: 67,
      height: 99
    }));
  it('rejects out-of-bounds and undersized rectangles', () => {
    expect(validRect({ x: 0.9, y: 0, width: 0.3, height: 0.5 })).toBe(false);
    expect(validRect({ x: 0, y: 0, width: 0.19, height: 0.5 })).toBe(false);
  });
  it('clamps interactive geometry to the original', () =>
    expect(clampRect({ x: 1, y: -0.1, width: 0.5, height: 0.1 })).toEqual({
      x: 0.5,
      y: 0,
      width: 0.5,
      height: 0.2
    }));
  it('locks pixel aspect on portrait-oriented coordinates', () => {
    const r = fitAspect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }, 4 / 5, 2 / 3);
    expect((r.width * (2 / 3)) / r.height).toBeCloseTo(4 / 5);
    expect(validRect(r)).toBe(true);
  });
});
