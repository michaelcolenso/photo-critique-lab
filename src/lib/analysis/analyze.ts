import { histogram } from './histogram';
import { percentile } from './luminance';
import { clipping } from './clipping';
import { sharpness } from './sharpness';
import type { LocalAnalysis } from '$lib/critique/schema';
export function analyze(data: Uint8ClampedArray, width: number, height: number): LocalAnalysis {
  const h = histogram(data),
    count = width * height;
  return {
    histogram: h,
    clipping: clipping(h.luminance),
    sharpness: { global: sharpness(data, width, height) },
    luminance: {
      mean: h.luminance.reduce((sum, n, i) => sum + n * i, 0) / Math.max(1, count),
      p05: percentile(h.luminance, 0.05, count),
      p50: percentile(h.luminance, 0.5, count),
      p95: percentile(h.luminance, 0.95, count)
    }
  };
}
