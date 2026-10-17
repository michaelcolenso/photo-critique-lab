export function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function percentile(bins: number[], fraction: number, count: number) {
  let cumulative = 0;
  for (let i = 0; i < bins.length; i++) {
    cumulative += bins[i];
    if (cumulative >= Math.max(1, count * fraction)) return i;
  }
  return 255;
}
