import { it, expect } from 'vitest';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);

for (const configured of [true, false])
  it(`smoke never invokes a configured model (configured=${configured})`, async () => {
    let validCritiqueRequests = 0;
    const server = createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) chunks.push(Buffer.from(chunk));
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
      response.setHeader('content-type', 'application/json');
      response.setHeader('cache-control', 'no-store');
      if (request.url === '/api/health')
        return response.end(
          JSON.stringify({ status: 'ok', critique: configured ? 'configured' : 'unavailable' })
        );
      if (request.url === '/api/critique') {
        if (request.headers.origin === 'https://elsewhere.invalid') response.statusCode = 403;
        else if (body?.image === 'invalid') response.statusCode = 400;
        else {
          validCritiqueRequests++;
          response.statusCode = 503;
        }
        return response.end(JSON.stringify({ error: 'AI critique is not configured' }));
      }
      if (request.url === '/api/event')
        response.statusCode = body?.properties?.filename ? 400 : 202;
      response.end('{}');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No test server address');
    try {
      await run(process.execPath, ['scripts/smoke.mjs'], {
        env: {
          ...process.env,
          PCL_BASE_URL: `http://127.0.0.1:${address.port}`,
          PCL_EXPECT_AI: 'auto'
        }
      });
      expect(validCritiqueRequests).toBe(configured ? 0 : 1);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  });
