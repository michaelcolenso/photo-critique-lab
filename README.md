# Photo Critique Lab

A validation MVP for photographic judgment and literal crop discovery. Upload → critique → compare Original/A/B/C → refine → choose → export. The original stays in the browser. There is no image generation or retouching.

Built with Svelte 5, SvelteKit 2, TypeScript, Tailwind, Zod, Canvas, a dedicated analysis Web Worker, the official OpenAI SDK, and Cloudflare Workers/Analytics Engine.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`. Credentials are deliberately deferred: uploads, local measurements, manual cropping and export work without a key; critique displays an honest unavailable state with retry. No mock analysis is used in production. The included public sample follows the same pipeline as your own upload.

When credential setup is authorized, configure `OPENAI_API_KEY` server-side in `.env.local` for Vite or `.dev.vars` for local Wrangler. Both files are ignored. `.env.example` documents variable names without secrets. Use `wrangler secret put OPENAI_API_KEY` for a deployed Worker. `OPENAI_MODEL` defaults to `gpt-5-mini` and can be overridden server-side.

## Verify

```sh
npm run check
npm test
npm run test:e2e
npm run build
npm run cf:check
npm run cf:dev
# In a second terminal:
npm run smoke
```

Playwright defaults to `/usr/bin/chromium`. Set `CHROMIUM_PATH` to your local Chromium executable, or install Playwright Chromium and pass its path. Tests run desktop and a 320px touch viewport; the mobile project uses Chromium emulation, not a claim of WebKit/iOS certification. Regenerate the synthetic engineering fixtures with `npm run fixtures`. Twenty licensed public photographs for live golden-set evaluation are included in `tests/golden/`, with sources, attribution and pinned checksums; see [the fixture guide](tests/golden/README.md).

On restricted managed workspaces where the default user config directory is read-only, set `XDG_CONFIG_HOME` to a writable directory (for example `/tmp/pcl-config`) and optionally `WRANGLER_LOG_PATH=/tmp/pcl-wrangler.log` for local commands. This changes local tool paths, not application behavior.

## Deploy

`wrangler.jsonc` configures the Cloudflare Worker, static assets, server-side model variable and `pcl_validation_events` Analytics Engine dataset. Authenticate the intended Cloudflare account, confirm Analytics Engine is available for that account, then run:

```sh
npm run deploy
```

Run a remote smoke test using the returned URL as documented in [VALIDATION.md](docs/VALIDATION.md). Deployment and live model verification remain pending until credentials are available; a successful build or dry run is not a deployed acceptance result.

## Contracts and limits

- JPEG/PNG/WebP, up to 30 MiB; graceful rejection above an 80 MP browser working limit.
- EXIF orientation is normalized before any coordinate calculation. Proxy long edge ≤1600 px; EXIF stripped.
- Three unique crop roles; semantic bounds/diversity validation, one correction pass, then labeled fallback geometry.
- Crop edits preserve original recommendation coordinates. Numeric controls complement drag/resize; aspect presets and reset are available.
- AI judgments, deterministic measurements and user preferences remain separate.
- Strict telemetry schemas reject filenames, EXIF, images and arbitrary fields. Personal notes stay in tab memory. Behavioral capture requires the dataset binding.
- JPEG export uses available original crop resolution at quality .95. JPEG is lossy; transparency is composited on white. No overlays are exported.
- No accounts, subscriptions, photo library, RAW, batch workflow, generative fill, retouching or personalized critic.

See [architecture](docs/ARCHITECTURE.md), [critique schema](docs/CRITIQUE-SCHEMA.md), and [validation protocol](docs/VALIDATION.md). Live quality and latency must be tested with representative real photographs before the proposed 200-evaluation experiment.
