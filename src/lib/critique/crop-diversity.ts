import type { Rect } from './schema';
export function cropIoU(a: Rect, b: Rect): number {
  const intersection =
    Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return intersection / (a.width * a.height + b.width * b.height - intersection);
}
export function wildcardDifferent(wild: Rect, strongest: Rect): boolean {
  const aspect = Math.abs(wild.width / wild.height / (strongest.width / strongest.height) - 1);
  const area = Math.abs((wild.width * wild.height) / (strongest.width * strongest.height) - 1);
  const center =
    Math.hypot(
      wild.x + wild.width / 2 - strongest.x - strongest.width / 2,
      wild.y + wild.height / 2 - strongest.y - strongest.height / 2
    ) / Math.SQRT2;
  return aspect > 0.2 || area > 0.25 || center > 0.12;
}
/** Fixed role order: A conservative, B strongest, C wildcard. */
export function diverse(crops: Rect[]): boolean {
  if (crops.length !== 3) return false;
  const [a, b, c] = crops;
  return (
    cropIoU(a, b) < 0.82 && cropIoU(a, c) < 0.72 && cropIoU(b, c) < 0.78 && wildcardDifferent(c, b)
  );
}
