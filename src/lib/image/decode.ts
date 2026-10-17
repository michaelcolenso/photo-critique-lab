import { orientedBitmap } from './orientation';
export interface ImageMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  mimeType: string;
  bytes: number;
}
export const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp'];
export async function decode(file: File) {
  if (!SUPPORTED.includes(file.type)) throw new Error('This version supports JPEG, PNG and WebP.');
  if (file.size > 30 * 1024 * 1024) throw new Error('Choose a photograph smaller than 30 MB.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await orientedBitmap(file);
  } catch {
    throw new Error('This photograph could not be decoded. Try another JPEG, PNG or WebP.');
  }
  if (bitmap.width * bitmap.height > 80_000_000) {
    bitmap.close();
    throw new Error('This photograph exceeds the browser’s 80 megapixel working limit.');
  }
  const metadata: ImageMetadata = {
    width: bitmap.width,
    height: bitmap.height,
    aspectRatio: bitmap.width / bitmap.height,
    mimeType: file.type,
    bytes: file.size
  };
  return { bitmap, metadata };
}
