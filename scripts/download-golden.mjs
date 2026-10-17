import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const run = promisify(execFile);
const root = new URL('../tests/golden/', import.meta.url);
await mkdir(root, { recursive: true });
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
for (let i = 0; i < manifest.images.length; i += 4) {
  await Promise.all(
    manifest.images.slice(i, i + 4).map(async (entry) => {
      const destination = new URL(entry.file, root).pathname;
      await run('curl', [
        '--fail',
        '--location',
        '--silent',
        '--show-error',
        '--max-time',
        '30',
        entry.downloadUrl,
        '--output',
        destination
      ]);
      const bytes = await readFile(destination);
      const metadata = await sharp(bytes).metadata();
      if (metadata.format !== 'jpeg' || Math.max(metadata.width, metadata.height) > 1600)
        throw new Error(`Invalid fixture: ${entry.file}`);
      entry.width = metadata.width;
      entry.height = metadata.height;
      entry.sha256 = createHash('sha256').update(bytes).digest('hex');
    })
  );
}
await writeFile(new URL('manifest.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Downloaded and verified ${manifest.images.length} licensed golden photographs.`);
