import { readdir, readFile } from 'node:fs/promises';
const root = '.svelte-kit/cloudflare/_app';
let count = 0;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await inspect(path);
    else if (/\.(js|json)$/.test(entry.name)) {
      const source = await readFile(path, 'utf8');
      if (/OPENAI_API_KEY|sk-(?:proj|svcacct)-[A-Za-z0-9_-]{20,}/.test(source))
        throw new Error(`Server credential material in client output: ${path}`);
      if (
        source.includes(
          'A quiet central subject becomes stronger when the pale edge is given less space.'
        )
      )
        throw new Error(`Test critique shipped to browser: ${path}`);
      count++;
    }
  }
}
await inspect(root);
console.log(`Checked ${count} client assets: no server credentials or test critique.`);
