import { drawCrop } from './crop';
import type { Rect } from '$lib/critique/schema';
export async function exportCrop(image: ImageBitmap, rect: Rect): Promise<Blob> {
  const canvas = document.createElement('canvas');
  drawCrop(canvas, image, rect, Infinity);
  const ctx = canvas.getContext('2d')!;
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed.'))),
      'image/jpeg',
      0.95
    )
  );
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
