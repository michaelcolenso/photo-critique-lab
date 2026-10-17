export function clipping(bins: number[]) {
  const count = bins.reduce((a, b) => a + b, 0);
  if (!count) return { shadowFraction: 0, highlightFraction: 0 };
  return {
    shadowFraction: bins.slice(0, 4).reduce((a, b) => a + b, 0) / count,
    highlightFraction: bins.slice(252).reduce((a, b) => a + b, 0) / count
  };
}
