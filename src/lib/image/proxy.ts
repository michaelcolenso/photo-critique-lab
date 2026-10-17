import { drawCrop, ORIGINAL } from './crop';
export async function makeProxy(image: ImageBitmap): Promise<{ image: string; pixels: ImageData }> {
  const canvas = document.createElement('canvas');
  drawCrop(canvas, image, ORIGINAL, 1600);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  // JPEG cannot represent transparency. Composite explicitly, without changing the canonical bitmap.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return {
    image: canvas.toDataURL('image/jpeg', 0.85),
    pixels: ctx.getImageData(0, 0, canvas.width, canvas.height)
  };
}
