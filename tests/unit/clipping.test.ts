import { it, expect } from 'vitest';
import { clipping } from '../../src/lib/analysis/clipping';
it('includes threshold values and computes known fractions', () => {
  const bins = Array(256).fill(0);
  bins[0] = 10;
  bins[3] = 5;
  bins[4] = 10;
  bins[128] = 50;
  bins[251] = 10;
  bins[252] = 5;
  bins[255] = 10;
  expect(clipping(bins)).toEqual({ shadowFraction: 0.15, highlightFraction: 0.15 });
});
it('handles an empty histogram', () =>
  expect(clipping(Array(256).fill(0))).toEqual({ shadowFraction: 0, highlightFraction: 0 }));
