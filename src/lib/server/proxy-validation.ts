/** Check JPEG framing and dimensions without decoding or retaining image bytes. */
export function validProxy(dataUrl: string): boolean {
  if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(dataUrl)) return false;
  try {
    const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const binary = atob(encoded);
    const byte = (i: number) => binary.charCodeAt(i);
    const word = (i: number) => byte(i) * 256 + byte(i + 1);
    if (word(0) !== 0xffd8) return false;
    let i = 2;
    let dimensions = false;
    while (i + 4 < binary.length) {
      if (byte(i) !== 0xff) return false;
      const marker = byte(i + 1);
      i += 2;
      if (marker === 0xda) return dimensions;
      if (marker === 0xe1) return false; // EXIF must have been stripped.
      const length = word(i);
      if (length < 2 || i + length > binary.length) return false;
      if ([0xc0, 0xc1, 0xc2].includes(marker)) {
        if (length < 8) return false;
        const height = word(i + 3),
          width = word(i + 5);
        if (!width || !height || Math.max(width, height) > 1600) return false;
        dimensions = true;
      }
      i += length;
    }
  } catch {
    return false;
  }
  return false;
}
