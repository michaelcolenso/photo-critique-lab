import { json } from '@sveltejs/kit';
export const noStore = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
export function failure(message: string, status: number) {
  return json({ error: message }, { status, headers: noStore });
}
export async function readJSON(request: Request, limit: number): Promise<unknown> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new Error('Expected JSON.');
  if (Number(request.headers.get('content-length')) > limit)
    throw new Error('Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Request body is missing.');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new Error('Request is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(result));
}
export function sameOrigin(request: Request, url: URL) {
  const origin = request.headers.get('origin');
  return (
    (!origin || origin === url.origin) && request.headers.get('sec-fetch-site') !== 'cross-site'
  );
}
