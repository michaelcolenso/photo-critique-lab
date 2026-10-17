import { luminance } from './luminance';
/** Variance of a luminance Laplacian; proxy-scale dependent, not an aesthetic score. */
export function sharpness(data: Uint8ClampedArray, width: number, height: number) {
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++)
    gray[i] = luminance(data[4 * i], data[4 * i + 1], data[4 * i + 2]);
  let sum = 0,
    squares = 0,
    count = 0;
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x,
        lap = gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      sum += lap;
      squares += lap * lap;
      count++;
    }
  return count ? Math.max(0, squares / count - (sum / count) ** 2) : 0;
}
