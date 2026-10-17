/** Modern browser decoders apply all eight EXIF orientations exactly once. */
export async function orientedBitmap(file: Blob): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}
