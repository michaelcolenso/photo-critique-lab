import type { Rect } from '$lib/critique/schema';

export const ORIGINAL: Rect = { x: 0, y: 0, width: 1, height: 1 };
export const MIN_CROP = 0.2;
export function validRect(r: Rect, minimum = MIN_CROP): boolean {
  return (
    [r.x, r.y, r.width, r.height].every(Number.isFinite) &&
    r.x >= 0 &&
    r.y >= 0 &&
    r.width >= minimum &&
    r.height >= minimum &&
    r.x + r.width <= 1 + 1e-9 &&
    r.y + r.height <= 1 + 1e-9
  );
}
export function clampRect(r: Rect): Rect {
  const width = Math.max(MIN_CROP, Math.min(1, r.width));
  const height = Math.max(MIN_CROP, Math.min(1, r.height));
  return {
    x: Math.max(0, Math.min(1 - width, r.x)),
    y: Math.max(0, Math.min(1 - height, r.y)),
    width,
    height
  };
}
export function pixelRect(r: Rect, width: number, height: number) {
  if (!validRect(r, 0) || r.width <= 0 || r.height <= 0) throw new Error('Invalid crop geometry.');
  const x = Math.min(width - 1, Math.round(r.x * width)),
    y = Math.min(height - 1, Math.round(r.y * height));
  const right = Math.min(width, Math.round((r.x + r.width) * width));
  const bottom = Math.min(height, Math.round((r.y + r.height) * height));
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}
export function fitAspect(r: Rect, aspect: number, imageAspect: number): Rect {
  const normalized = aspect / imageAspect;
  let width = r.width,
    height = width / normalized;
  if (height > 1) {
    height = 1;
    width = normalized;
  }
  if (height < MIN_CROP) {
    height = MIN_CROP;
    width = height * normalized;
  }
  if (width < MIN_CROP) {
    width = MIN_CROP;
    height = width / normalized;
  }
  if (width > 1 || height > 1)
    throw new Error('This aspect ratio is too extreme for this photograph.');
  return clampRect({
    x: r.x + (r.width - width) / 2,
    y: r.y + (r.height - height) / 2,
    width,
    height
  });
}
export function drawCrop(
  canvas: HTMLCanvasElement,
  image: ImageBitmap,
  rect: Rect,
  maxEdge = 1600
) {
  const p = pixelRect(rect, image.width, image.height);
  const scale = Math.min(1, maxEdge / Math.max(p.width, p.height));
  canvas.width = Math.max(1, Math.round(p.width * scale));
  canvas.height = Math.max(1, Math.round(p.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');
  ctx.drawImage(image, p.x, p.y, p.width, p.height, 0, 0, canvas.width, canvas.height);
}
