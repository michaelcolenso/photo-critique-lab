import { luminance } from './luminance';
export function histogram(data: Uint8ClampedArray) {
  const result = {
    luminance: Array<number>(256).fill(0),
    red: Array<number>(256).fill(0),
    green: Array<number>(256).fill(0),
    blue: Array<number>(256).fill(0)
  };
  for (let i = 0; i < data.length; i += 4) {
    result.red[data[i]]++;
    result.green[data[i + 1]]++;
    result.blue[data[i + 2]]++;
    result.luminance[Math.round(luminance(data[i], data[i + 1], data[i + 2]))]++;
  }
  return result;
}
