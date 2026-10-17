import { analyze } from './analyze';
self.onmessage = (
  event: MessageEvent<{ data: Uint8ClampedArray; width: number; height: number }>
) => {
  try {
    const { data, width, height } = event.data;
    self.postMessage({ result: analyze(data, width, height) });
  } catch {
    self.postMessage({ error: 'Local analysis could not be completed.' });
  }
};
